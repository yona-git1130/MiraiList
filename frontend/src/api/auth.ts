import { apiFetch } from "./client";
import type { User } from "../types/user";

type AuthResponse = { user: User; token: string };

/** 新規ユーザー登録APIを呼び出す。成功するとユーザー情報とJWTが返る。 */
export function registerRequest(params: {
  username: string;
  email: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** ログインAPIを呼び出す。成功するとユーザー情報とJWTが返る。 */
export function loginRequest(params: { email: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** ログイン中の自分自身の情報を取得する。 */
export function fetchMe() {
  return apiFetch<{ user: User }>("/users/me");
}

/** 自分のプロフィールを更新する。パスワードも変えたい場合はcurrentPassword/newPasswordを含める。 */
export function updateMeRequest(params: {
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  return apiFetch<{ user: User }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}
