import { apiFetch } from "./client";
import type { Post } from "../types/post";

export function listPostsRequest(params: { tagId?: number; achievedOnly?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.tagId !== undefined) search.set("tagId", String(params.tagId));
  if (params.achievedOnly) search.set("achieved", "true");
  const query = search.toString();
  return apiFetch<{ posts: Post[] }>(`/posts${query ? `?${query}` : ""}`);
}

export function getPostRequest(id: number) {
  return apiFetch<{ post: Post }>(`/posts/${id}`);
}

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

export function updatePostRequest(
  id: number,
  params: { title: string; body: string; tagIds: number[]; isPrivate: boolean }
) {
  return apiFetch<{ post: Post }>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export function deletePostRequest(id: number) {
  return apiFetch<void>(`/posts/${id}`, { method: "DELETE" });
}

export function setPostAchievedRequest(id: number, achieved: boolean) {
  return apiFetch<{ post: Post }>(`/posts/${id}/achieved`, {
    method: "PATCH",
    body: JSON.stringify({ achieved }),
  });
}

export function setAchievementCommentRequest(id: number, comment: string) {
  return apiFetch<{ post: Post }>(`/posts/${id}/achievement-comment`, {
    method: "PATCH",
    body: JSON.stringify({ comment }),
  });
}
