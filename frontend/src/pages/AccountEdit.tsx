import { useState } from "react";
import type { FormEvent } from "react";
import { Header } from "../components/Header";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { resyncAfterPaste } from "../utils/pasteSync";

/**
 * アカウント編集画面。ユーザー名・メールアドレスの変更、および任意でのパスワード変更ができる。
 * パスワードを変えないときは現在/新しいパスワードとも空欄のままAPIへは送らない。
 */
export function AccountEdit() {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await updateProfile({
        username,
        email,
        // パスワードを変更しないときは空欄のままでよいので、undefinedにして送らない
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page" style={{ maxWidth: 420 }}>
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, color: "var(--accent-ink)" }}>アカウントを編集</h1>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            ユーザー名
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onPaste={resyncAfterPaste(setUsername)}
              required
            />
          </label>
          <label className="field">
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPaste={resyncAfterPaste(setEmail)}
              required
            />
          </label>

          <fieldset className="tag-fieldset">
            <legend>パスワードを変更する場合のみ入力</legend>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <PasswordField
                label="現在のパスワード"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
              <PasswordField
                label="新しいパスワード(8文字以上)"
                value={newPassword}
                onChange={setNewPassword}
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </fieldset>

          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "var(--accent-ink)", margin: 0 }}>更新しました。</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ alignSelf: "center" }}
          >
            {submitting ? "保存中..." : "保存"}
          </button>
        </form>
      </main>
    </>
  );
}
