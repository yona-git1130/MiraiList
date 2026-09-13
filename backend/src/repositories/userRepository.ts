// users テーブルへのSQLアクセスをここに集約する。
// controller側は「SQLを直接書かず、この関数を呼ぶだけ」にすることで役割を分離する。

import { pool } from "../db/pool";
import { UserRow } from "../types/user";

/**
 * メールアドレスでユーザーを1件検索する(ログイン・重複チェックで使用)。
 * @returns 見つかった行、なければnull
 */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  // $1 のようなプレースホルダーを使うことで、値をそのまま文字列連結しない。
  // これがSQLインジェクション(悪意ある文字列でSQLを書き換えられる攻撃)を防ぐ基本。
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] ?? null;
}

/**
 * IDでユーザーを1件検索する。
 * @returns 見つかった行、なければnull
 */
export async function findUserById(id: number): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] ?? null;
}

/**
 * ユーザーを新規作成する。role/statusはDB側のデフォルト("user"/"active")になる。
 * @param params.passwordHash bcryptで生成済みのハッシュ値(生パスワードは受け取らない)
 * @returns 作成した行
 */
export async function createUser(params: {
  username: string;
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`, // RETURNING * で、作成した行をそのまま受け取れる
    [params.username, params.email, params.passwordHash]
  );
  return result.rows[0];
}

/**
 * ユーザー名・メールアドレスを更新する。
 * @returns 更新後の行、対象が存在しなければnull
 */
export async function updateProfile(
  id: number,
  params: { username: string; email: string }
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *",
    [params.username, params.email, id]
  );
  return result.rows[0] ?? null;
}

/**
 * パスワードハッシュを上書きする(本人のパスワード変更・管理者によるリセットの両方で使用)。
 * @param passwordHash bcryptで生成済みのハッシュ値
 */
export async function updatePassword(id: number, passwordHash: string): Promise<void> {
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
}

/**
 * 全ユーザーを一覧取得する(ユーザー管理画面用)。
 * 管理者を上、一般ユーザーを下に表示するため、role = 'admin' かどうかで先に並べ替え、
 * 同じ権限内では登録が古い順(id昇順)にする。
 * @returns 全ユーザーの行
 */
export async function listUsers(): Promise<UserRow[]> {
  const result = await pool.query<UserRow>(
    `SELECT * FROM users
     ORDER BY (role = 'admin') DESC, id ASC`
  );
  return result.rows;
}

/**
 * ユーザーを削除する。
 * usersを消せばON DELETE CASCADEにより、そのユーザーのposts/comments/reactionsも連動して消える。
 */
export async function deleteUser(id: number): Promise<void> {
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
}

/**
 * ユーザーの停止/有効状態を切り替える。
 * @returns 更新後の行、対象が存在しなければnull
 */
export async function setUserStatus(
  id: number,
  status: "active" | "suspended"
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    "UPDATE users SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] ?? null;
}

/**
 * ユーザーのroleを変更する(現状はユーザー管理画面からの管理者昇格でのみ使用)。
 * @returns 更新後の行、対象が存在しなければnull
 */
export async function setUserRole(id: number, role: "user" | "admin"): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
    [role, id]
  );
  return result.rows[0] ?? null;
}
