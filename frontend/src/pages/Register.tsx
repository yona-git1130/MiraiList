import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { useFitRowScale } from "../hooks/useFitRowScale";
import { ApiError } from "../api/client";
import { resyncAfterPaste } from "../utils/pasteSync";
import registerHero from "../assets/register-hero.jpg";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 紹介文が<br />の位置以外で折り返さないよう、実際の幅を測って必要な分だけ
  // 文字を縮小する(PC・スマホどちらでも指定した改行位置だけで改行させたいため)
  const introRef = useFitRowScale<HTMLParagraphElement>("--intro-scale", 1, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-hero">
      <main className="page" style={{ maxWidth: 420 }}>
        {/* ヘッダーは表示せず、写真とロゴ・紹介文を中央に配置した専用のレイアウトにする。
            グレーを基調としたシンプルなデザインのため、他画面のような星や円の飾りは置かない。
            この部分だけで画面の高さいっぱいを使い、「新規登録」以降は下にスクロールしないと
            見えないようにする */}
        <div className="register-hero-top" style={{ textAlign: "center" }}>
          <div
            className="register-hero-photo"
            role="img"
            aria-label=""
            style={{ backgroundImage: `url(${registerHero})` }}
          />
          <Link to="/" style={{ textDecoration: "none" }}>
            <span className="brand-text" style={{ fontSize: 40 }}>未来リスト</span>
          </Link>
          <p ref={introRef} className="muted-text register-intro-text" style={{ marginTop: 16, lineHeight: 1.6 }}>
            未来リストは未来にある『やってみたい』
            <br />
            を集めるリストです。
            <br />
            挑戦したいこと、楽しみにしていること、
            <br />
            いつか叶えたいことを自由に書き出してみてください。
            <br />
            また、みんなの未来リストから
            <br />
            あなたの『やってみたい』が広がるかもしれません。
          </p>
        </div>
        {/* 写真の部分と同じように、こちらも画面の高さいっぱいを使って縦に中央寄せする。
            スマホでスクロールしたときに、ちょうどこの新規登録フォームが画面の
            真ん中に来るようにするため */}
        <div className="register-form-section">
          <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, textAlign: "center", color: "var(--accent-ink)" }}>
            新規登録
          </h1>
          <form onSubmit={handleSubmit} className="form auth-form" style={{ alignItems: "center", textAlign: "center" }}>
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
                autoComplete="email"
                required
              />
            </label>
            <PasswordField
              label="パスワード(8文字以上)"
              value={password}
              onChange={setPassword}
              minLength={8}
              required
              autoComplete="new-password"
            />
            {error && <p className="error-text">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ alignSelf: "center" }}
            >
              {submitting ? "登録中..." : "登録"}
            </button>
          </form>
          <p className="muted-text" style={{ marginTop: 16, textAlign: "center" }}>
            アカウントをお持ちの方は <Link to="/login">こちら</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
