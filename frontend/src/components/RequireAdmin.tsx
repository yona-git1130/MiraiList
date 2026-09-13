import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * 未ログインならログイン画面へ、ログイン中でも管理者でなければトップページへ戻す。
 * @param children 管理者にだけ見せたい画面
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
