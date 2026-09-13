import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../repositories/userRepository";

/**
 * ログイン必須にするミドルウェア。
 * `Authorization: Bearer <JWT>` ヘッダーを検証し、成功したら `req.user` に
 * `{ id, role }` をセットして次の処理に進む。
 * @returns 401: ヘッダーがない/Bearer形式でない/トークンが無効
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization; // "Bearer <token>" の形式で送られてくる想定
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  try {
    // jwt.verify の戻り値の型はライブラリ側の汎用的な型なので、一度 unknown を経由して
    // 自分たちが実際にトークンへ詰めた形にキャストする
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as {
      sub: number;
      role: "user" | "admin";
    };
    req.user = { id: payload.sub, role: payload.role }; // 以降のハンドラで req.user が使えるようになる
    next(); // 次の処理(実際のルートハンドラ)へ進む
  } catch {
    return res.status(401).json({ error: "トークンが無効です" });
  }
}

/**
 * 管理者権限を必須にするミドルウェア。requireAuthの後に使う想定。
 * @returns 403: `req.user.role` が "admin" でない場合
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "管理者権限が必要です" });
  }
  next();
}

/**
 * 停止(suspended)中のユーザーによる書き込みを拒否するミドルウェア。requireAuthの後に使う想定。
 * status はJWT発行後に変わりうる(ログイン中に管理者が停止する場合がある)ため、
 * トークンの中身を信用せず、毎回DBから最新の状態を取り直す。
 * @returns 401: ユーザーが既に存在しない / 403: status が "suspended"
 */
export async function requireActive(req: Request, res: Response, next: NextFunction) {
  const user = await findUserById(req.user!.id);
  if (!user) {
    return res.status(401).json({ error: "ユーザーが見つかりません" });
  }
  if (user.status === "suspended") {
    return res.status(403).json({ error: "アカウントが停止されているため、この操作はできません" });
  }
  next();
}
