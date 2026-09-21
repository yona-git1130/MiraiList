import { pool } from "../db/pool";
import { REACTION_TYPES, ReactionType, ReactionCounts, RankingEntry } from "../types/reaction";

/**
 * リアクションを追加する、または既存のリアクションを別の種類に上書きする。
 * reactionsテーブルの `UNIQUE(post_id, user_id)` 制約を利用し、1回のSQLで実現する。
 */
export async function upsertReaction(params: {
  postId: number;
  userId: number;
  reactionType: ReactionType;
}): Promise<void> {
  // reactions テーブルには UNIQUE(post_id, user_id) 制約がある。
  // ON CONFLICT はその制約に違反した(=すでにこのユーザーがこの投稿にリアクション済み)場合の
  // 挙動を指定できる。ここでは「新しい種類で上書きする」を1回のSQLで実現している。
  // EXCLUDED は「今回INSERTしようとした値」を指す特別なキーワード。
  await pool.query(
    `INSERT INTO reactions (post_id, user_id, reaction_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (post_id, user_id)
     DO UPDATE SET reaction_type = EXCLUDED.reaction_type, created_at = now()`,
    [params.postId, params.userId, params.reactionType]
  );
}

/** 指定ユーザーが指定投稿に付けたリアクションを削除する。 */
export async function deleteReaction(params: { postId: number; userId: number }): Promise<void> {
  await pool.query(`DELETE FROM reactions WHERE post_id = $1 AND user_id = $2`, [
    params.postId,
    params.userId,
  ]);
}

/**
 * みんなのリスト用に、投稿日時が新しい順で投稿を取得する。
 * LEFT JOINなので、リアクションが1件も付いていない投稿も(件数すべて0として)一覧には残る。
 * カードと同じ「種類ごとの絵文字+件数」で表示できるよう、種類別の内訳(counts)も
 * 1回のクエリでまとめて取得する。
 * @param tagId 指定するとそのタグが付いている投稿だけに絞り込む。省略(undefined)すると
 *   「すべて」タブ用に、タグを問わず全投稿を対象にする
 * @param limit 取得件数の上限
 * @param achievedOnly trueなら達成済みの投稿だけに絞り込む
 * @returns 新着順に並んだ一覧
 */
export async function getRanking(
  tagId: number | undefined,
  limit = 10,
  achievedOnly = false
): Promise<RankingEntry[]> {
  const filterClauses = REACTION_TYPES.map(
    (type) => `'${type}', COUNT(*) FILTER (WHERE r.reaction_type = '${type}')`
  ).join(", ");

  // 管理者に削除された投稿、および「マイリストにだけ表示」の投稿は、みんなのリストには常に出さない
  const conditions: string[] = ["p.deleted_by_admin = false", "p.is_private = false"];
  const values: unknown[] = [];

  if (tagId !== undefined) {
    values.push(tagId);
    // JOINで絞り込むと、後述のタグ集約(json_agg)がその1タグだけになってしまう
    // (投稿についている他のタグが消えてしまう)ため、EXISTSで絞り込みだけを行う。
    // postRepository.listPosts と同じ考え方。
    conditions.push(
      `EXISTS (SELECT 1 FROM post_tags pt2 WHERE pt2.post_id = p.id AND pt2.tag_id = $${values.length})`
    );
  }
  if (achievedOnly) {
    conditions.push("p.is_achieved = true");
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  values.push(limit);
  const limitPlaceholder = `$${values.length}`;

  const result = await pool.query<{
    post_id: number;
    title: string;
    body: string;
    is_achieved: boolean;
    achievement_comment: string | null;
    author_id: number;
    author_username: string;
    tags: { id: number; name: string; icon: string }[];
    counts: ReactionCounts;
  }>(
    `SELECT
       p.id AS post_id, p.title, p.body, p.is_achieved, p.achievement_comment, p.user_id AS author_id,
       u.username AS author_username,
       COALESCE(
         json_agg(json_build_object('id', t.id, 'name', t.name, 'icon', t.icon))
           FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) AS tags,
       (
         SELECT json_build_object(${filterClauses})
         FROM reactions r
         WHERE r.post_id = p.id
       ) AS counts
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN post_tags pt ON pt.post_id = p.id
     LEFT JOIN tags t ON t.id = pt.tag_id
     ${where}
     GROUP BY p.id, u.id
     ORDER BY p.created_at DESC
     LIMIT ${limitPlaceholder}`,
    values
  );

  type ReactionRankingRow = {
    post_id: number;
    title: string;
    body: string;
    is_achieved: boolean;
    achievement_comment: string | null;
    author_id: number;
    author_username: string;
    tags: { id: number; name: string; icon: string }[];
    counts: ReactionCounts;
  };

  return result.rows.map((row: ReactionRankingRow) => ({
    post_id: row.post_id,
    title: row.title,
    body: row.body,
    counts: row.counts,
    is_achieved: row.is_achieved,
    achievement_comment: row.achievement_comment,
    author_id: row.author_id,
    author_username: row.author_username,
    tags: row.tags,
  }));
}

/**
 * 指定ユーザーが指定投稿に対して既に押しているリアクションを取得する。
 * @returns リアクションの種類、未リアクションならnull
 */
export async function getUserReaction(postId: number, userId: number): Promise<ReactionType | null> {
  const result = await pool.query<{ reaction_type: ReactionType }>(
    `SELECT reaction_type FROM reactions WHERE post_id = $1 AND user_id = $2`,
    [postId, userId]
  );
  return result.rows[0]?.reaction_type ?? null;
}
