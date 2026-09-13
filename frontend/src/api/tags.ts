import { apiFetch } from "./client";
import type { Tag } from "../types/tag";

/** 固定4種のタグ一覧を取得する。 */
export function listTagsRequest() {
  return apiFetch<{ tags: Tag[] }>("/tags");
}
