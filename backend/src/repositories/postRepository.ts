import { pool } from "../db/pool";
import { PostDetail } from "../types/post";
import { REACTION_TYPES, ReactionCounts } from "../types/reaction";

// リアクション種類ごとの件数を1つのJSONオブジェクトに集約する式。
// 一覧・詳細どちらのカードにもリアクションボタンを表示できるよう、post本体と同じクエリで取ってくる。
const REACTION_COUNTS_FILTER = REACTION_TYPES.map(
  (type) => `'${type}', COUNT(*) FILTER (WHERE r.reaction_type = '${type}')`
).join(", ");

// posts + users(投稿者) + tags を1つの投稿としてまとめて取得するためのSQLの共通部分。
// - JOIN users: 投稿者のusernameを一緒に取ってくる
// - LEFT JOIN post_tags/tags: 投稿についているタグを取ってくる(タグが0個の投稿もあるのでLEFT JOIN)
// - json_agg(...): GROUP BYでposts1件にまとめる際、複数あるタグ行を1つのJSON配列に集約する
// - FILTER (WHERE t.id IS NOT NULL): タグが0個のときに [null] ではなく [] になるようにする
// - reaction_counts: 相関サブクエリなので、上のtags集約(GROUP BY)には影響しない
const SELECT_POST_DETAIL = `
  SELECT
    p.id, p.title, p.body, p.created_at, p.updated_at, p.is_achieved, p.deleted_by_admin,
    p.achievement_comment, p.is_private,
    u.id AS author_id, u.username AS author_username,
    COALESCE(
      json_agg(json_build_object('id', t.id, 'name', t.name, 'icon', t.icon))
        FILTER (WHERE t.id IS NOT NULL),
      '[]'
    ) AS tags,
    (
      SELECT json_build_object(${REACTION_COUNTS_FILTER})
      FROM reactions r
      WHERE r.post_id = p.id
    ) AS reaction_counts
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN post_tags pt ON pt.post_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id
`;

type PostDetailRow = {
  id: number;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
  is_achieved: boolean;
  deleted_by_admin: boolean;
  achievement_comment: string | null;
  is_private: boolean;
  author_id: number;
  author_username: string;
  tags: { id: number; name: string; icon: string }[];
  reaction_counts: ReactionCounts;
};

/** SQLの生の行(PostDetailRow)を、API/フロントで使うPostDetail形にマッピングする。 */
function toPostDetail(row: PostDetailRow): PostDetail {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: { id: row.author_id, username: row.author_username },
    tags: row.tags,
    reaction_counts: row.reaction_counts,
    is_achieved: row.is_achieved,
    deleted_by_admin: row.deleted_by_admin,
    achievement_comment: row.achievement_comment,
    is_private: row.is_private,
  };
}

/**
 * 投稿を一覧取得する(マイリスト画面で使用)。
 * @param params.tagId 指定するとそのタグの投稿だけに絞り込む
 * @param params.authorId 指定するとその投稿者の投稿だけに絞り込む(マイリストでは常に指定する)
 * @param params.achievedOnly trueなら達成済みの投稿だけに絞り込む
 * @returns 作成日時の新しい順に並んだ投稿一覧
 */
export async function listPosts(params: {
  tagId?: number;
  authorId?: number;
  achievedOnly?: boolean;
}): Promise<PostDetail[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.tagId !== undefined) {
    values.push(params.tagId);
    // タグで絞り込みたい場合、WHERE t.id = $1 と書くと集約対象の行自体が減ってしまい
    // 「そのタグ以外に付いている他のタグ」までtags配列から消えてしまう。
    // そのためEXISTSのサブクエリで「絞り込み」と「タグの集約」を分離する。
    conditions.push(
      `EXISTS (SELECT 1 FROM post_tags pt2 WHERE pt2.post_id = p.id AND pt2.tag_id = $${values.length})`
    );
  }

  if (params.authorId !== undefined) {
    values.push(params.authorId);
    conditions.push(`p.user_id = $${values.length}`);
  }

  if (params.achievedOnly) {
    conditions.push(`p.is_achieved = true`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query<PostDetailRow>(
    `${SELECT_POST_DETAIL}
     ${where}
     GROUP BY p.id, u.id
     ORDER BY p.created_at DESC`,
    values
  );
  return result.rows.map(toPostDetail);
}

/**
 * 投稿を1件、タグ・投稿者名・リアクション件数込みで取得する。
 * @returns 見つかった投稿、なければnull
 */
export async function findPostById(id: number): Promise<PostDetail | null> {
  const result = await pool.query<PostDetailRow>(
    `${SELECT_POST_DETAIL}
     WHERE p.id = $1
     GROUP BY p.id, u.id`,
    [id]
  );
  return result.rows[0] ? toPostDetail(result.rows[0]) : null;
}

/**
 * 投稿を作成し、タグを紐付ける。
 * 「投稿を作る」+「タグを紐付ける」は2つ以上のSQL文だが、片方だけ成功すると
 * データが中途半端な状態になってしまう。BEGIN〜COMMITで1つの塊(トランザクション)にし、
 * 途中でエラーが起きたらROLLBACKで全部なかったことにする。
 * @returns 作成した投稿のID
 */
export async function createPost(params: {
  userId: number;
  title: string;
  body: string;
  tagIds: number[];
  isPrivate: boolean;
}): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const postResult = await client.query<{ id: number }>(
      `INSERT INTO posts (user_id, title, body, is_private) VALUES ($1, $2, $3, $4) RETURNING id`,
      [params.userId, params.title, params.body, params.isPrivate]
    );
    const postId = postResult.rows[0].id;

    for (const tagId of params.tagIds) {
      await client.query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)`,
        [postId, tagId]
      );
    }

    await client.query("COMMIT");
    return postId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release(); // 使い終わった接続を必ずプールに返す
  }
}

/**
 * 投稿の内容とタグをまとめて更新する。
 * タグの更新は「一旦全部消してから、送られてきたタグだけ入れ直す」方式にする。
 * 差分計算(増えた分だけ追加、減った分だけ削除)より単純で、タグの数も少ないので問題ない。
 */
export async function updatePost(
  id: number,
  params: { title: string; body: string; tagIds: number[]; isPrivate: boolean }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE posts SET title = $1, body = $2, is_private = $3, updated_at = now() WHERE id = $4`,
      [params.title, params.body, params.isPrivate, id]
    );

    // タグの更新は「一旦全部消してから、送られてきたタグだけ入れ直す」方式にする。
    // 差分計算(増えた分だけ追加、減った分だけ削除)より単純で、タグの数も少ないので問題ない。
    await client.query(`DELETE FROM post_tags WHERE post_id = $1`, [id]);
    for (const tagId of params.tagIds) {
      await client.query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)`,
        [id, tagId]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** 投稿の達成状態(is_achieved)を更新する。 */
export async function setAchieved(id: number, achieved: boolean): Promise<void> {
  await pool.query(`UPDATE posts SET is_achieved = $1 WHERE id = $2`, [achieved, id]);
}

/** 達成直後のモーダルで入力する感想を保存する。みんなのリストに表示される。 */
export async function setAchievementComment(id: number, comment: string): Promise<void> {
  await pool.query(`UPDATE posts SET achievement_comment = $1 WHERE id = $2`, [comment, id]);
}

/**
 * 投稿を完全に削除する(投稿者本人による削除で使用)。
 * postsを消せば、外部キーにON DELETE CASCADEを指定しているため
 * post_tags/comments/reactionsの関連行も自動で一緒に消える。
 */
export async function deletePost(id: number): Promise<void> {
  await pool.query(`DELETE FROM posts WHERE id = $1`, [id]);
}

/**
 * 管理者が他人の投稿を削除するときに使う、フラグを立てるだけのソフトデリート。
 * 完全には消さないことで、投稿者本人の「リスト一覧」で
 * 「管理者により削除されました」と表示できるようにしている。
 */
export async function softDeleteByAdmin(id: number): Promise<void> {
  await pool.query(`UPDATE posts SET deleted_by_admin = true WHERE id = $1`, [id]);
}
