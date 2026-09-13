import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * ログインしていないユーザーがこの中の画面にアクセスしたら、ログイン画面へ強制的に飛ばす。
 * (バックエンド側のrequireAuthとは別物。あくまでUI上のガードで、
 *  本当の防御は毎回APIが行っている401/403チェックの方)
 * @param children 認証済みユーザーにだけ見せたい画面
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
