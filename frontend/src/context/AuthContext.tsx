import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/user";
import { getToken, setToken, clearToken } from "../api/token";
import { loginRequest, registerRequest, fetchMe, updateMeRequest } from "../api/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean; // 起動直後、保存済みトークンからログイン状態を復元している最中かどうか
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (params: {
    username: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
};

// Context: 「ログイン中のユーザー情報」のように複数の画面から使いたい状態を、
// props でバケツリレーしなくても、ツリーのどこからでも読み書きできるようにする仕組み
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * アプリ全体をラップし、ログイン状態(user)と認証関連の操作をContext経由で配る。
 * 起動時は保存済みトークンからログイン状態の復元を試み、その間はloadingをtrueにする。
 * @param children 認証状態を使う可能性のあるアプリ全体
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ページを再読み込みしても、保存済みのトークンが有効ならログイン状態を復元する
    if (!getToken()) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken()) // トークンが無効・期限切れなら破棄してログアウト扱いにする
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // apiFetch が401を受け取った時(トークン切れ・紐づくユーザーが削除された、など)に
    // 発火するイベント。トークン自体は apiFetch 側で既に破棄済みなので、
    // ここでは画面上のログイン状態(user)を null に戻すだけでよい。
    // これにより、保護ページ(RequireAuth配下)にいる場合は自動的にログイン画面へ遷移する。
    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  async function login(email: string, password: string) {
    const { user, token } = await loginRequest({ email, password });
    setToken(token);
    setUser(user);
  }

  async function register(username: string, email: string, password: string) {
    const { user, token } = await registerRequest({ username, email, password });
    setToken(token);
    setUser(user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  async function updateProfile(params: {
    username: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const { user } = await updateMeRequest(params);
    setUser(user); // 画面上のユーザー名などをすぐに反映する
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * AuthContextの値を取得するフック。useContextを毎回nullチェックせずに使えるようまとめている。
 * AuthProviderの内側以外で呼ぶとエラーを投げる。
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider の内側でのみ使えます");
  }
  return ctx;
}
