import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireAuth, requireAdmin, requireActive } from "./authMiddleware";
import { findUserById } from "../repositories/userRepository";
import type { UserRow } from "../types/user";

// DBやJWTライブラリの本物を呼ばないよう、モジュールごとモックに差し替える
vi.mock("jsonwebtoken");
vi.mock("../repositories/userRepository");

function createMockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 1,
    username: "テストユーザー",
    email: "test@example.com",
    password_hash: "hashed",
    role: "user",
    status: "active",
    created_at: new Date(),
    ...overrides,
  };
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("Authorizationヘッダーがないときは401を返す", () => {
    const req = { headers: {} } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "認証が必要です" });
    expect(next).not.toHaveBeenCalled();
  });

  it("Bearer形式でないヘッダーは401を返す", () => {
    const req = { headers: { authorization: "Token abc" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("検証に失敗するトークンは401を返す", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const req = { headers: { authorization: "Bearer badtoken" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "トークンが無効です" });
    expect(next).not.toHaveBeenCalled();
  });

  it("有効なトークンならreq.userをセットしてnextを呼ぶ", () => {
    vi.mocked(jwt.verify).mockReturnValue({ sub: 42, role: "admin" } as never);
    const req = { headers: { authorization: "Bearer goodtoken" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: 42, role: "admin" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("管理者以外は403を返す", () => {
    const req = { user: { id: 1, role: "user" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "管理者権限が必要です" });
    expect(next).not.toHaveBeenCalled();
  });

  it("管理者ならnextを呼ぶ", () => {
    const req = { user: { id: 1, role: "admin" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireActive", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("ユーザーが見つからないときは401を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);
    const req = { user: { id: 1, role: "user" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    await requireActive(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("停止中のユーザーは403を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow({ status: "suspended" }));
    const req = { user: { id: 1, role: "user" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    await requireActive(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "アカウントが停止されているため、この操作はできません",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("有効なユーザーならnextを呼ぶ", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow({ status: "active" }));
    const req = { user: { id: 1, role: "user" } } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    await requireActive(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
