import { apiFetch } from "./client";
import type { RankingEntry } from "../types/ranking";

/**
 * みんなのリスト(リアクション数ランキング)を取得する。
 * @param params.tagId 指定するとそのタグで絞り込む。未指定は「すべて」タブ用
 * @param params.achievedOnly trueなら達成済みの投稿だけに絞り込む
 */
export function getRankingRequest(params: { tagId?: number; achievedOnly?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.tagId !== undefined) search.set("tagId", String(params.tagId));
  if (params.achievedOnly) search.set("achieved", "true");
  const query = search.toString();
  return apiFetch<{ ranking: RankingEntry[] }>(`/posts/ranking${query ? `?${query}` : ""}`);
}
