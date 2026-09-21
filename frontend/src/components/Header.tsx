import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFitRowScale } from "../hooks/useFitRowScale";
import { UserMenu } from "./UserMenu";
import { OnboardingTour } from "./OnboardingTour";

/**
 * 全画面共通のヘッダー。ロゴとナビゲーション(ログイン状態で内容が変わる)を表示する。
 * ログイン中: リストに追加・マイリスト・みんなのリスト・ユーザーメニュー
 * 未ログイン: ログイン・新規登録のみ(みんなのリストはログイン必須のため表示しない。
 * ログイン/新規登録画面ではリンクを一部省略)
 * 初回ログインのユーザーには、ナビゲーションの意味をツールチップで案内する。
 */
export function Header() {
  const { user, logout, completeOnboarding } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  // スマホの狭い画面でも、ロゴとnavが折り返さずPCと同じ1行の配置になるよう、
  // 実際に描画された幅を測って縮小率(--header-scale)を掛け直す。
  // (縮むだけで、余裕があっても元のサイズより大きくはしないのでmaxScale: 1)
  const headerRef = useFitRowScale<HTMLElement>("--header-scale", 1, [user]);

  // 初回ログイン向けツールチップの説明対象。ツアー中に測るのでrefだけ用意しておく
  const addLinkRef = useRef<HTMLAnchorElement>(null);
  const myListLinkRef = useRef<HTMLAnchorElement>(null);
  const rankingLinkRef = useRef<HTMLAnchorElement>(null);

  return (
    <>
      <header className="site-header" ref={headerRef}>
        <Link to="/" className="brand">
          <span className="brand-text">未来リスト</span>
        </Link>
        <nav>
          {user ? (
            <>
              <Link to="/posts/new" ref={addLinkRef}>
                リストに追加
              </Link>
              <Link to="/" ref={myListLinkRef}>
                マイリスト
              </Link>
              <Link to="/ranking" ref={rankingLinkRef}>
                みんなのリスト
              </Link>
              <UserMenu user={user} onLogout={logout} />
            </>
          ) : (
            <>
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
      {user && !user.has_seen_onboarding && (
        <OnboardingTour
          steps={[
            { ref: addLinkRef, text: "「やってみたい」をここから追加できます。" },
            { ref: myListLinkRef, text: "自分が追加したリストの一覧です。" },
            { ref: rankingLinkRef, text: "みんなの「やってみたい」を見たり、リアクションできます。" },
          ]}
          onFinish={completeOnboarding}
        />
      )}
    </>
  );
}
