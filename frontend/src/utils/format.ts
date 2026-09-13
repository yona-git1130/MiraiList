// 投稿本文などを一覧で短く見せるための省略表示。maxを超える場合は末尾に…を付ける
export function excerpt(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// 日付だけを「YYYY/MM/DD」形式で表示する(マイリスト・みんなのリストなどで使用)
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 日付+時刻を表示する(投稿詳細画面で使用)
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
