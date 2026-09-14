import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRequiredEnvVars } from "./checkEnv";

describe("checkRequiredEnvVars", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.JWT_SECRET = "secret";
    process.env.FRONTEND_ORIGIN = "http://localhost:5173";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("必須の環境変数が揃っていれば何もしない", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    checkRequiredEnvVars();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("必須の環境変数が欠けているとエラーを出してプロセスを終了する", () => {
    delete process.env.JWT_SECRET;
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    checkRequiredEnvVars();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("JWT_SECRET"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
