// JWTをブラウザのlocalStorageに保存/取得/削除する。
// localStorageに入れておくと、ページを再読み込みしてもログイン状態が消えない。
const TOKEN_KEY = "ideaboard_token";

/** 保存済みのJWTを取得する。未ログインならnull。 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** ログイン成功後にJWTを保存する。 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** ログアウト時・認証エラー時にJWTを削除する。 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
