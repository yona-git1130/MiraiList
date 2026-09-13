import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../repositories/userRepository";
import { toPublicUser } from "../types/user";

const SALT_ROUNDS = 10; // bcryptがハッシュ化に使う計算コスト。大きいほど安全だが遅くなる

/**
 * ログイン済みであることを表すJWTを発行する。
 * @param user トークンに埋め込む最小限のユーザー情報(id, role)
 * @returns 署名済みのJWT文字列
 */
function signToken(user: { id: number; role: string }) {
  return jwt.sign(
    { sub: user.id, role: user.role }, // トークンに埋め込む情報(ペイロード)
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"] }
  );
}

// Express 5 では async 関数内で例外が起きると自動でエラーハンドリングミドルウェアに
// 渡されるため、try/catchで拾わなかった想定外のエラーもここで書かなくても安全に処理される。

/**
 * 新規ユーザー登録API(POST /api/auth/register)。
 * パスワードをbcryptでハッシュ化して保存し、そのままログイン状態になるようJWTも発行する。
 * @param req.body.username 表示名
 * @param req.body.email ログインID(重複不可)
 * @param req.body.password 生のパスワード(8文字以上)
 * @returns 201: 作成したユーザー情報とJWT / 400: 入力不備 / 409: メール重複
 */
export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body ?? {};

  // 入力チェック: ここで弾いておくことで、不正な値がDBまで届かないようにする
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, password は必須です" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "パスワードは8文字以上にしてください" });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "このメールアドレスは既に登録されています" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ username, email, passwordHash });
  const token = signToken(user);

  return res.status(201).json({ user: toPublicUser(user), token });
}

/**
 * ログインAPI(POST /api/auth/login)。
 * メールアドレス・パスワードの照合に成功したらJWTを発行する。
 * @param req.body.email ログインID
 * @param req.body.password 生のパスワード
 * @returns 200: ユーザー情報とJWT / 400: 入力不備 / 401: 認証失敗(メール・パスワードどちらが誤りかは区別しない)
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "email, password は必須です" });
  }

  const user = await findUserByEmail(email);
  // メールが存在しない場合とパスワードが違う場合で、あえて同じメッセージにする。
  // 別メッセージにすると「このメールは登録されている/されていない」が第三者に分かってしまうため。
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "メールアドレスまたはパスワードが違います" });
  }

  const token = signToken(user);
  return res.status(200).json({ user: toPublicUser(user), token });
}
