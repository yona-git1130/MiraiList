import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactNode } from "react";
import { Header } from "../components/Header";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import {
  listUsersRequest,
  adminDeleteUserRequest,
  adminSetUserStatusRequest,
  adminSetUserPasswordRequest,
  adminSetUserRoleRequest,
} from "../api/admin";
import type { User } from "../types/user";
import { ApiError } from "../api/client";

// 操作欄のハンバーガーメニュー。外側クリックで閉じる(UserMenuと同じ考え方)。
// 中身は呼び出し側が children(close) で自由に組み立てる。
// テーブルが overflow-x: auto で囲まれていてそのままでは吹き出しが枠内で
// 切れてしまうため、document.body に portal で描画し、画面基準の座標で位置合わせする。
function RowMenu({ children }: { children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="row-menu-trigger"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="操作メニュー"
      >
        ☰
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            className="row-menu-dropdown"
            role="menu"
            style={{ position: "fixed", top: coords.top, right: coords.right }}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body
        )}
    </>
  );
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // パスワード変更フォームを開いている対象ユーザーのid(1人分だけ開く想定)
  const [passwordEditId, setPasswordEditId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function load() {
    listUsersRequest()
      .then(({ users }) => setUsers(users))
      .catch(() => setError("ユーザー一覧の取得に失敗しました"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openPasswordEdit(id: number) {
    setPasswordEditId(id);
    setNewPassword("");
    setPasswordError(null);
  }

  function closePasswordEdit() {
    setPasswordEditId(null);
    setNewPassword("");
    setPasswordError(null);
  }

  async function handleSetPassword(e: FormEvent, id: number) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("パスワードは8文字以上にしてください");
      return;
    }
    setPasswordSubmitting(true);
    setPasswordError(null);
    try {
      await adminSetUserPasswordRequest(id, newPassword);
      closePasswordEdit();
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "パスワードの変更に失敗しました");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function handleToggleStatus(target: User) {
    const nextStatus = target.status === "active" ? "suspended" : "active";
    const label = nextStatus === "suspended" ? "停止" : "有効化";
    if (!window.confirm(`${target.username} さんを${label}しますか？`)) return;
    try {
      await adminSetUserStatusRequest(target.id, nextStatus);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "操作に失敗しました");
    }
  }

  async function handleDelete(target: User) {
    if (!window.confirm(`${target.username} さんを削除しますか？この操作は取り消せません。`)) return;
    try {
      await adminDeleteUserRequest(target.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "削除に失敗しました");
    }
  }

  async function handlePromote(target: User) {
    if (!window.confirm(`${target.username} さんを管理者に変更しますか？`)) return;
    try {
      await adminSetUserRoleRequest(target.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "操作に失敗しました");
    }
  }

  return (
    <>
      <Header />
      <main className="page wide">
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, color: "var(--accent-ink)" }}>ユーザー管理</h1>

        {loading && <p className="muted-text">読み込み中...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ユーザー名</th>
                  <th>メール</th>
                  <th>権限</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isSuspended = u.status === "suspended";
                  // パスワードリセット・管理者への変更は「一般ユーザーのみ」対象
                  // (管理者同士のパスワードや権限はこの画面からは変更できない)
                  const isGeneralUser = u.role !== "admin";
                  return (
                    <Fragment key={u.id}>
                      <tr>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.role === "admin" ? "管理者" : "一般"}</td>
                        <td>
                          <span className={`status-pill${isSuspended ? " suspended" : ""}`}>
                            {isSuspended ? "停止中" : "有効"}
                          </span>
                        </td>
                        <td>
                          {isSelf ? (
                            <span className="muted-text" style={{ fontSize: 12 }}>
                              (自分)
                            </span>
                          ) : (
                            <RowMenu>
                              {(close) =>
                                isSuspended ? (
                                  <>
                                    <button
                                      type="button"
                                      className="user-menu-item"
                                      onClick={() => {
                                        close();
                                        handleToggleStatus(u);
                                      }}
                                    >
                                      有効
                                    </button>
                                    <button
                                      type="button"
                                      className="user-menu-item danger"
                                      onClick={() => {
                                        close();
                                        handleDelete(u);
                                      }}
                                    >
                                      削除
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {isGeneralUser && (
                                      <button
                                        type="button"
                                        className="user-menu-item"
                                        onClick={() => {
                                          close();
                                          openPasswordEdit(u.id);
                                        }}
                                      >
                                        PWリセット
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="user-menu-item"
                                      onClick={() => {
                                        close();
                                        handleToggleStatus(u);
                                      }}
                                    >
                                      停止
                                    </button>
                                    {isGeneralUser && (
                                      <button
                                        type="button"
                                        className="user-menu-item"
                                        onClick={() => {
                                          close();
                                          handlePromote(u);
                                        }}
                                      >
                                        管理者に変更
                                      </button>
                                    )}
                                  </>
                                )
                              }
                            </RowMenu>
                          )}
                        </td>
                      </tr>
                      {passwordEditId === u.id && (
                        <tr>
                          <td colSpan={5} style={{ background: "var(--panel-hover)" }}>
                            <form
                              onSubmit={(e) => handleSetPassword(e, u.id)}
                              style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}
                            >
                              <div style={{ minWidth: 260 }}>
                                <PasswordField
                                  label={`${u.username} さんの新しいパスワード(8文字以上)`}
                                  value={newPassword}
                                  onChange={setNewPassword}
                                  minLength={8}
                                  autoComplete="new-password"
                                />
                              </div>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={passwordSubmitting}
                              >
                                {passwordSubmitting ? "変更中..." : "変更する"}
                              </button>
                              <button type="button" className="btn-text" onClick={closePasswordEdit}>
                                キャンセル
                              </button>
                              {passwordError && <p className="error-text">{passwordError}</p>}
                            </form>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
