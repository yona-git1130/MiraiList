import { pool } from "../db/pool";

export type CommentDetail = {
  id: number;
  post_id: number;
  body: string;
  created_at: Date;
  author: { id: number; username: string };
};

const SELECT_COMMENT = `
  SELECT c.id, c.post_id, c.body, c.created_at, u.id AS author_id, u.username AS author_username
  FROM comments c
  JOIN users u ON u.id = c.user_id
`;

type CommentRow = {
  id: number;
  post_id: number;
  body: string;
  created_at: Date;
  author_id: number;
  author_username: string;
};

/** SQLの生の行(CommentRow)を、API/フロントで使うCommentDetail形にマッピングする。 */
function toCommentDetail(row: CommentRow): CommentDetail {
  return {
    id: row.id,
    post_id: row.post_id,
    body: row.body,
    created_at: row.created_at,
    author: { id: row.author_id, username: row.author_username },
  };
}

/**
 * 投稿へのコメントを一覧取得する。
 * @returns 投稿日時の古い順に並んだコメント一覧
 */
export async function listCommentsByPost(postId: number): Promise<CommentDetail[]> {
  const result = await pool.query<CommentRow>(
    `${SELECT_COMMENT} WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
    [postId]
  );
  return result.rows.map(toCommentDetail);
}

/**
 * コメントを1件、投稿者名込みで取得する。
 * @returns 見つかったコメント、なければnull
 */
export async function findCommentById(id: number): Promise<CommentDetail | null> {
  const result = await pool.query<CommentRow>(`${SELECT_COMMENT} WHERE c.id = $1`, [id]);
  return result.rows[0] ? toCommentDetail(result.rows[0]) : null;
}

/**
 * コメントを新規作成する。
 * @returns 作成したコメントのID
 */
export async function createComment(params: {
  postId: number;
  userId: number;
  body: string;
}): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO comments (post_id, user_id, body) VALUES ($1, $2, $3) RETURNING id`,
    [params.postId, params.userId, params.body]
  );
  return result.rows[0].id;
}

/** コメントを削除する。 */
export async function deleteComment(id: number): Promise<void> {
  await pool.query(`DELETE FROM comments WHERE id = $1`, [id]);
}
