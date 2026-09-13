import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFitRowScale } from "../hooks/useFitRowScale";
import { UserMenu } from "./UserMenu";

/**
 * 全画面共通のヘッダー。ロゴとナビゲーション(ログイン状態で内容が変わる)を表示する。
 * ログイン中: リストに追加・マイリスト・みんなのリスト・ユーザーメニュー
 * 未ログイン: みんなのリスト・ログイン・新規登録(ログイン/新規登録画面ではリンクを一部省略)
 */
export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  // スマホの狭い画面でも、ロゴとnavが折り返さずPCと同じ1行の配置になるよう、
  // 実際に描画された幅を測って縮小率(--header-scale)を掛け直す。
  // (縮むだけで、余裕があっても元のサイズより大きくはしないのでmaxScale: 1)
  const headerRef = useFitRowScale<HTMLElement>("--header-scale", 1, [user]);

  return (
    <>
      <header className="site-header" ref={headerRef}>
        <Link to="/" className="brand">
          <span className="brand-text">未来リスト</span>
        </Link>
        <nav>
          {user ? (
            <>
              <Link to="/posts/new">リストに追加</Link>
              <Link to="/">マイリスト</Link>
              <Link to="/ranking">みんなのリスト</Link>
              <UserMenu user={user} onLogout={logout} />
            </>
          ) : (
            <>
              {!isLoginPage && !isRegisterPage && <Link to="/ranking">みんなのリスト</Link>}
              {!isLoginPage && (
                // 新規登録画面では、登録ボタンと同じ見た目(btn-primary)で目立たせる
                <Link to="/login" className={isRegisterPage ? "btn btn-primary" : "btn"}>
                  ログイン
                </Link>
              )}
              {/* 新規登録画面では、自分自身へのリンクになるので表示しない */}
              {!isRegisterPage && (
                <Link to="/register" className="btn btn-primary">
                  新規登録
                </Link>
              )}
            </>
          )}
        </nav>
      </header>
    </>
  );
}
