import { apiFetch } from "./client";
import type { ReactionType } from "../types/reaction";

/** 投稿にリアクションを付ける、または種類を変更する。 */
export function upsertReactionRequest(postId: number, type: ReactionType) {
  return apiFetch<{ message: string }>(`/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

/** 自分が付けたリアクションを取り消す。 */
export function deleteReactionRequest(postId: number) {
  return apiFetch<void>(`/posts/${postId}/reactions`, { method: "DELETE" });
}

/** ログイン中のユーザーが指定の投稿に付けているリアクションを取得する。 */
export function getMyReactionRequest(postId: number) {
  return apiFetch<{ reactionType: ReactionType | null }>(`/posts/${postId}/reactions/me`);
}
