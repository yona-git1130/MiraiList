import { apiFetch } from "./client";
import type { Comment } from "../types/comment";

/** 投稿へのコメント一覧を取得する。 */
export function listCommentsRequest(postId: number) {
  return apiFetch<{ comments: Comment[] }>(`/posts/${postId}/comments`);
}

/** 投稿にコメントを付ける。 */
export function createCommentRequest(postId: number, body: string) {
  return apiFetch<{ comment: Comment }>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

/** コメントを削除する(投稿者本人 or 管理者のみ成功する)。 */
export function deleteCommentRequest(commentId: number) {
  return apiFetch<void>(`/comments/${commentId}`, { method: "DELETE" });
}
