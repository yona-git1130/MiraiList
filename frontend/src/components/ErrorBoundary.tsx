import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * 配下のどこかのコンポーネントが描画中に例外を投げたとき、画面全体が真っ白になって
 * 復帰できなくなるのを防ぐためのエラーバウンダリ。
 * Reactの仕様上、これはフック(useState等)では作れずクラスコンポーネントでのみ実装できる。
 * @param children 監視対象のコンポーネントツリー(基本的にはアプリ全体)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 開発中・本番問わず、原因調査のためにコンソールへ詳細を残しておく
    console.error("予期しないエラーが発生しました:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page" style={{ textAlign: "center" }}>
          <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 12, color: "var(--accent-ink)" }}>
            エラーが発生しました
          </h1>
          <p className="muted-text" style={{ marginBottom: 20 }}>
            予期しない問題が発生しました。お手数ですが、ページを再読み込みしてください。
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
