import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// globals: false にしているため、@testing-library/reactの自動クリーンアップが
// 効かない。各テストの後に必ずDOMを片付け、テスト間で要素が重複しないようにする
afterEach(() => {
  cleanup();
});
