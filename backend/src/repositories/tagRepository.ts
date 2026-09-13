import { pool } from "../db/pool";
import { TagRow } from "../types/post";

/**
 * タグを一覧取得する(固定4種)。
 * @returns id昇順に並んだタグ一覧
 */
export async function listTags(): Promise<TagRow[]> {
  const result = await pool.query<TagRow>("SELECT * FROM tags ORDER BY id");
  return result.rows;
}
