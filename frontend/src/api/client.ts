// バックエンドと通信するための共通関数。あちこちで fetch を直接書く代わりに、
// エラー処理やURLの組み立てをここに1箇所にまとめる。

// import.meta.env.VITE_* は Vite が用意する仕組みで、.env の値をビルド時に埋め込む。
// "VITE_" で始まる変数だけがブラウザに送られるコードに含まれるため、
// APIキーやパスワードのような秘密情報は絶対に VITE_ を付けて置いてはいけない。
import { getToken, clearToken } from "./token";

const API_URL = import.meta.env.VITE_API_URL;

/** APIがエラーを返したときに投げる例外。HTTPステータスコードとメッセージを保持する。 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * バックエンドAPIを呼び出す共通関数。ログイン中ならJWTを自動で付与し、
 * エラーレスポンスはApiErrorに変換して投げる。401の場合はトークンを破棄し、
 * `auth:unauthorized` イベントを発火してアプリ全体に伝える。
 * @param path APIのパス(例: "/posts")。API_URLに続けて結合される
 * @param options fetchにそのまま渡すオプション(method, bodyなど)
 * @returns レスポンスのJSONをパースした値(204の場合はundefined)
 * @throws {ApiError} レスポンスが成功以外のステータスだった場合
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // ログイン中ならトークンを自動で付ける。呼び出す側は毎回トークンを意識しなくてよい
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    // バックエンドは { error: "メッセージ" } という形でエラーを返す設計にしてある
    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
      // トークンの期限切れ・改ざん・(今回のように)紐づくユーザーが削除された、などで
      // 認証が通らなくなっている状態。持っているトークンはもう使えないので破棄し、
      // アプリ全体に「ログイン状態が切れた」ことを知らせる(AuthContextが購読して user を null にする)。
      clearToken();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    throw new ApiError(res.status, body.error ?? "エラーが発生しました");
  }

  if (res.status === 204) {
    // 204 No Content にはレスポンスボディがないので、JSONとして読もうとするとエラーになる
    return undefined as T;
  }

  return res.json();
}
