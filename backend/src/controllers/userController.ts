import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  markOnboardingSeen,
  setUserStatus,
  setUserRole,
  updatePassword,
  updateProfile,
} from "../repositories/userRepository";
import { toPublicUser } from "../types/user";

const SALT_ROUNDS = 10;

/**
 * ログイン中の自分自身の情報を取得するAPI(GET /api/users/me、要ログイン)。
 * @returns 200: 自分のユーザー情報(password_hashは含まない) / 404: トークンのユーザーが既に存在しない
 */
export async function getMe(req: Request, res: Response) {
  // req.user は requireAuth ミドルウェアが検証済みのトークンからセットしてくれている
  const user = await findUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }
  return res.json({ user: toPublicUser(user) });
}

/**
 * 自分のプロフィール(ユーザー名・メールアドレス)を更新するAPI(PATCH /api/users/me、要ログイン)。
 * パスワードも変更したい場合は currentPassword/newPassword を一緒に送る。
 * @param req.body.username 新しい表示名(必須)
 * @param req.body.email 新しいメールアドレス(必須、他人と重複不可)
 * @param req.body.currentPassword パスワードを変更する場合のみ必須(本人確認用)
 * @param req.body.newPassword 新しいパスワード(8文字以上)
 * @returns 200: 更新後のユーザー情報 / 400: 入力不備 / 401: 現在のパスワード不一致 / 409: メール重複
 */
export async function updateMe(req: Request, res: Response) {
  const { username, email, currentPassword, newPassword } = req.body ?? {};

  if (!username || !email) {
    return res.status(400).json({ error: "username, email は必須です" });
  }

  const me = await findUserById(req.user!.id);
  if (!me) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }

  // メールアドレスを変更する場合、他の誰かが既に使っていないか確認する
  if (email !== me.email) {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "このメールアドレスは既に使われています" });
    }
  }

  // パスワードも変更したい場合は、現在のパスワードの確認を必須にする
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: "パスワードを変更するには現在のパスワードが必要です" });
    }
    if (!(await bcrypt.compare(currentPassword, me.password_hash))) {
      return res.status(401).json({ error: "現在のパスワードが違います" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "新しいパスワードは8文字以上にしてください" });
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await updatePassword(me.id, passwordHash);
  }

  const updated = await updateProfile(me.id, { username, email });
  res.json({ user: toPublicUser(updated!) });
}

/**
 * 初回ログイン向けオンボーディング(ヘッダーのツールチップ説明)を見終わったことを記録するAPI
 * (PATCH /api/users/me/onboarding、要ログイン)。ツールチップの「スキップ」「完了」どちらでも呼ぶ。
 * @returns 204: 記録成功
 */
export async function completeOnboarding(req: Request, res: Response) {
  await markOnboardingSeen(req.user!.id);
  res.status(204).send();
}

/**
 * 全ユーザーの一覧を取得するAPI(GET /api/users、要管理者)。
 * @returns ユーザー一覧(password_hashは含まない)
 */
export async function adminListUsers(_req: Request, res: Response) {
  const users = await listUsers();
  res.json({ users: users.map(toPublicUser) });
}

/**
 * 任意のユーザーを削除するAPI(DELETE /api/users/:id、要管理者)。
 * 自分自身は削除できないようにブロックする(誤操作で管理者不在になる事故を防ぐため)。
 * @returns 204: 削除成功 / 400: 自分自身を指定 / 404: 存在しないユーザー
 */
export async function adminDeleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);

  // 管理者が自分自身を削除できてしまうと、誤操作で管理者が誰もいなくなる事故につながるため防ぐ
  if (id === req.user!.id) {
    return res.status(400).json({ error: "自分自身は削除できません" });
  }

  const user = await findUserById(id);
  if (!user) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }

  await deleteUser(id);
  res.status(204).send();
}

/**
 * ユーザーを停止/有効化するAPI(PATCH /api/users/:id/suspend、要管理者)。
 * @param req.body.status "active" または "suspended"
 * @returns 200: 更新後のユーザー / 400: status不正・自分自身を指定 / 404: 存在しないユーザー
 */
export async function adminSetUserStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (status !== "active" && status !== "suspended") {
    return res.status(400).json({ error: "status は active か suspended を指定してください" });
  }
  if (id === req.user!.id) {
    return res.status(400).json({ error: "自分自身の状態は変更できません" });
  }

  const user = await setUserStatus(id, status);
  if (!user) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }
  res.json({ user: toPublicUser(user) });
}

/**
 * 一般ユーザーのパスワードを強制的に変更する(パスワードリセット)API
 * (PATCH /api/users/:id/password、要管理者)。
 * 元のパスワードを知る/確認する手段はどこにもない(password_hash は外部に一切返さない)。
 * あくまで「新しい値に上書きする」だけで、現在のパスワードを見ることはできない。
 * 対象は一般ユーザーに限定し、管理者同士のパスワードは変更できない。
 * @param req.body.newPassword 新しいパスワード(8文字以上)
 * @returns 204: 変更成功 / 400: パスワード不備・自分自身を指定 / 403: 対象が管理者 / 404: 存在しないユーザー
 */
export async function adminSetUserPassword(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { newPassword } = req.body ?? {};

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "新しいパスワードは8文字以上にしてください" });
  }
  if (id === req.user!.id) {
    return res.status(400).json({ error: "自分自身のパスワードはアカウント編集画面から変更してください" });
  }

  const target = await findUserById(id);
  if (!target) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }
  // 他の管理者のパスワードまで勝手に変更できてしまうと影響が大きいため、対象は一般ユーザーに限定する
  if (target.role === "admin") {
    return res.status(403).json({ error: "管理者のパスワードは変更できません" });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updatePassword(id, passwordHash);
  res.status(204).send();
}

/**
 * 任意のユーザーを管理者に昇格させるAPI(PATCH /api/users/:id/role、要管理者)。
 * 降格は事故防止のためこのAPIからは行わない(昇格専用)。
 * @returns 200: 更新後のユーザー(role: "admin") / 400: 既に管理者 / 404: 存在しないユーザー
 */
export async function adminSetUserRole(req: Request, res: Response) {
  const id = Number(req.params.id);

  const target = await findUserById(id);
  if (!target) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }
  if (target.role === "admin") {
    return res.status(400).json({ error: "すでに管理者です" });
  }

  const updated = await setUserRole(id, "admin");
  res.json({ user: toPublicUser(updated!) });
}
