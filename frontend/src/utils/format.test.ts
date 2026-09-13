import { describe, it, expect } from "vitest";
import { excerpt, formatDate, formatDateTime } from "./format";

describe("excerpt", () => {
  it("maxより短い文字列はそのまま返す", () => {
    expect(excerpt("短い文章", 10)).toBe("短い文章");
  });

  it("maxちょうどの長さなら省略しない", () => {
    expect(excerpt("12345", 5)).toBe("12345");
  });

  it("maxを超える文字列は切り詰めて…を付ける", () => {
    expect(excerpt("123456789", 5)).toBe("12345…");
  });
});

describe("formatDate", () => {
  it("日付をYYYY/MM/DD形式で返す", () => {
    expect(formatDate("2026-01-05T10:00:00.000Z")).toBe("2026/01/05");
  });
});

describe("formatDateTime", () => {
  it("日付と時刻を含む文字列を返す", () => {
    const result = formatDateTime("2026-01-05T10:00:00.000Z");
    // タイムゾーンによって時刻部分の見え方が変わるため、日付部分だけ厳密に確認する
    expect(result).toContain("2026/01/05");
  });
});
