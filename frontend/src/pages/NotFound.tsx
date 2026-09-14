import { Link } from "react-router-dom";
import { Header } from "../components/Header";

/**
 * どのルートにも一致しなかったときに表示する404画面。
 * 存在しないURLへ直接アクセスされた場合の受け皿(App.tsxのcatch-allルート `*` から使われる)。
 */
export function NotFound() {
  return (
    <>
      <Header />
      <main className="page" style={{ textAlign: "center" }}>
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 12, color: "var(--accent-ink)" }}>
          ページが見つかりません
        </h1>
        <p className="muted-text" style={{ marginBottom: 20 }}>
          お探しのページは存在しないか、移動・削除された可能性があります。
        </p>
        <Link to="/" className="btn btn-primary">
          トップページに戻る
        </Link>
      </main>
    </>
  );
}
