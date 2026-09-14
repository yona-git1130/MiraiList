import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// エラーを投げるためだけのテスト用コンポーネント
function Bomb(): never {
  throw new Error("テスト用の例外");
}

describe("ErrorBoundary", () => {
  it("正常な子要素はそのまま表示する", () => {
    render(
      <ErrorBoundary>
        <p>中身</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("中身")).toBeInTheDocument();
  });

  it("子要素が例外を投げたら、代わりにフォールバックUIを表示する", () => {
    // Reactが例外の詳細をテスト出力に流すのを抑えるため、一時的にconsole.errorを黙らせる
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再読み込み" })).toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
