import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../types/user";
import { UserIcon } from "./UserIcon";

/**
 * ヘッダー右端のユーザーアイコンを押すと開く、ドロップダウンメニュー。
 * アカウント編集・(管理者なら)ユーザー管理・ログアウトへの導線をまとめている。
 * @param user ログイン中のユーザー情報
 * @param onLogout ログアウト処理(呼び出し後、ログイン画面へ遷移する)
 */
export function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // メニューの外側をクリックしたら閉じる。
  // document全体のクリックを監視し、クリックされた場所がこのコンポーネントの中かどうかを調べる。
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        title={`${user.username} さん${user.role === "admin" ? "(管理者)" : ""}`}
      >
        <UserIcon />
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-name">
            {user.username} さん{user.role === "admin" && "(管理者)"}
          </div>
          <Link to="/account" className="user-menu-item" onClick={() => setOpen(false)}>
            アカウントを編集
          </Link>
          {user.role === "admin" && (
            <Link to="/admin/users" className="user-menu-item" onClick={() => setOpen(false)}>
              ユーザー管理
            </Link>
          )}
          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              setOpen(false);
              onLogout();
              navigate("/login");
            }}
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
