/**
 * 投稿本文などを一覧で短く見せるための省略表示。
 * @param text 元の文字列
 * @param max これを超える場合は切り詰める
 * @returns maxを超えた場合は末尾に…を付けた文字列、超えなければそのまま
 */
export function excerpt(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * 日付だけを「YYYY/MM/DD」形式で表示する(マイリスト・みんなのリストなどで使用)。
 * @param iso ISO 8601形式の日時文字列
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 日付+時刻を表示する(リスト詳細画面で使用)。
 * @param iso ISO 8601形式の日時文字列
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
