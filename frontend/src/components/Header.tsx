import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserMenu } from "./UserMenu";

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  // スマホの狭い画面でも、ロゴとnavが折り返さずPCと同じ1行の配置になるよう、
  // 実際に描画された幅を測って縮小率(--header-scale)を掛け直す。
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function fit() {
      if (!header) return;
      header.style.removeProperty("--header-scale");
      const available = header.clientWidth;
      const natural = header.scrollWidth;
      if (natural === 0 || available === 0) return;

      let scale = Math.min(available / natural, 1);
      for (let i = 0; i < 3; i++) {
        header.style.setProperty("--header-scale", String(scale));
        const actual = header.scrollWidth;
        if (actual <= available) break;
        scale *= available / actual;
      }
      header.style.setProperty("--header-scale", String(Math.min(scale * 0.99, 1)));
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(header);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [user]);

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
