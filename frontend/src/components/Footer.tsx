import { Link } from "react-router-dom";

/** 全画面共通のフッター。プライバシーポリシー・利用規約ページへのリンクだけを置いた簡素なもの。 */
export function Footer() {
  return (
    <footer className="site-footer">
      <Link to="/privacy">プライバシーポリシー・利用規約</Link>
    </footer>
  );
}
