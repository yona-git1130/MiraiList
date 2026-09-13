import { apiFetch } from "./client";
import type { Post } from "../types/post";

/** マイリスト(自分の投稿一覧)を取得する。tagId/achievedOnlyで絞り込める。 */
export function listPostsRequest(params: { tagId?: number; achievedOnly?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.tagId !== undefined) search.set("tagId", String(params.tagId));
  if (params.achievedOnly) search.set("achieved", "true");
  const query = search.toString();
  return apiFetch<{ posts: Post[] }>(`/posts${query ? `?${query}` : ""}`);
}

/** 投稿を1件取得する。 */
export function getPostRequest(id: number) {
  return apiFetch<{ post: Post }>(`/posts/${id}`);
}

/** 投稿を新規作成する。isPrivateをtrueにすると「マイリストにだけ表示」の非公開投稿になる。 */
export function createPostRequest(params: {
  title: string;
  body: string;
  tagIds: number[];
  isPrivate: boolean;
}) {
  return apiFetch<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** 投稿の内容(title/body/tagIds/isPrivate)をまとめて更新する。 */
export function updatePostRequest(
  id: number,
  params: { title: string; body: string; tagIds: number[]; isPrivate: boolean }
) {
  return apiFetch<{ post: Post }>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

/**
 * 投稿を削除する。投稿者本人なら完全削除、管理者が他人の投稿を削除する場合は
 * ソフトデリート(「管理者により削除されました」表示)になる。
 */
export function deletePostRequest(id: number) {
  return apiFetch<void>(`/posts/${id}`, { method: "DELETE" });
}

/** 投稿を達成済みにする(一度trueにしたらfalseには戻せない)。 */
export function setPostAchievedRequest(id: number, achieved: boolean) {
  return apiFetch<{ post: Post }>(`/posts/${id}/achieved`, {
    method: "PATCH",
    body: JSON.stringify({ achieved }),
  });
}

/** 達成直後のモーダルで入力した感想を保存する(達成済みの投稿にのみ有効)。 */
export function setAchievementCommentRequest(id: number, comment: string) {
  return apiFetch<{ post: Post }>(`/posts/${id}/achievement-comment`, {
    method: "PATCH",
    body: JSON.stringify({ comment }),
  });
}
