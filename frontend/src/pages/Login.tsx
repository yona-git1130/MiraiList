import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { resyncAfterPaste } from "../utils/pasteSync";

/** ログイン画面。メールアドレスとパスワードでログインし、成功したらトップページへ遷移する。 */
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/"); // ログイン成功後はトップページへ
    } catch {
      // バックエンドは「メールかパスワードのどちらが違うか」を教えない(セキュリティ上の理由)ので、
      // 画面側でも「未登録かもしれない」「パスワードを忘れたかもしれない」ことが伝わる案内文をまとめて表示する
      setError(
        "メールアドレスまたはパスワードが正しくありません。\nアカウントをお持ちでない方は、新規登録をお願いします。\nパスワードを忘れた方は、下の「パスワードを忘れた方はこちら」をご確認ください。"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-hero">
      <main className="page" style={{ maxWidth: 420 }}>
        {/* ヘッダーは表示せず、新規登録画面と同様にロゴを中央に配置した専用のレイアウトにする */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span className="brand-text" style={{ fontSize: 40 }}>未来リスト</span>
          </Link>
        </div>
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, textAlign: "center", color: "var(--accent-ink)" }}>
          ログイン
        </h1>
        <form onSubmit={handleSubmit} className="form auth-form" style={{ alignItems: "center", textAlign: "center" }}>
          <label className="field">
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPaste={resyncAfterPaste(setEmail)}
              autoComplete="email"
              required
            />
          </label>
          <PasswordField
            label="パスワード"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          {error && <p className="error-text" style={{ whiteSpace: "pre-line" }}>{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ alignSelf: "center" }}
          >
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="muted-text" style={{ marginTop: 16, textAlign: "center" }}>
          {/* ログイン処理中に押されて画面遷移してしまわないよう、送信中は非活性にする */}
          <Link
            to="/register"
            className={submitting ? "link-disabled" : undefined}
            aria-disabled={submitting}
            onClick={(e) => submitting && e.preventDefault()}
          >
            初めての方はこちら
          </Link>
        </p>
        <p className="muted-text" style={{ marginTop: 8, textAlign: "center" }}>
          {/* パスワードを忘れた方への案内(連絡先)は、プライバシーポリシーの「お問い合わせ」にある。
              そこまで直接スクロールして見せる(#contact)。ログイン処理中は押せないようにする */}
          <Link
            to="/privacy#contact"
            className={submitting ? "link-disabled" : undefined}
            aria-disabled={submitting}
            onClick={(e) => submitting && e.preventDefault()}
          >
            パスワードを忘れた方はこちら
          </Link>
        </p>
      </main>
    </div>
  );
}
