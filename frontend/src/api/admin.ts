import { apiFetch } from "./client";
import type { User } from "../types/user";

/** 全ユーザーの一覧を取得する(要管理者)。 */
export function listUsersRequest() {
  return apiFetch<{ users: User[] }>("/users");
}

/** ユーザーを削除する(要管理者。自分自身は削除できない)。 */
export function adminDeleteUserRequest(id: number) {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

/** ユーザーの停止/有効状態を切り替える(要管理者)。 */
export function adminSetUserStatusRequest(id: number, status: "active" | "suspended") {
  return apiFetch<{ user: User }>(`/users/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/** 一般ユーザーのパスワードを強制的にリセットする(要管理者。対象は一般ユーザーのみ)。 */
export function adminSetUserPasswordRequest(id: number, newPassword: string) {
  return apiFetch<void>(`/users/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

/** ユーザーを管理者に昇格させる(要管理者。降格はできない)。 */
export function adminSetUserRoleRequest(id: number) {
  return apiFetch<{ user: User }>(`/users/${id}/role`, {
    method: "PATCH",
  });
}
