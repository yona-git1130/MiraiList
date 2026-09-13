import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { register, login } from "./authController";
import { createUser, findUserByEmail } from "../repositories/userRepository";
import type { UserRow } from "../types/user";

vi.mock("bcrypt");
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
    password_hash: "hashed-password",
    role: "user",
    status: "active",
    created_at: new Date(),
    ...overrides,
  };
}

describe("register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("username, email, passwordのいずれかが欠けていたら400を返す", async () => {
    const req = { body: { username: "太郎", email: "" } } as Request;
    const res = createMockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("パスワードが8文字未満なら400を返す", async () => {
    const req = {
      body: { username: "太郎", email: "taro@example.com", password: "short" },
    } as Request;
    const res = createMockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "パスワードは8文字以上にしてください" });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("既に登録済みのメールアドレスなら409を返す", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(createUserRow());
    const req = {
      body: { username: "太郎", email: "test@example.com", password: "password123" },
    } as Request;
    const res = createMockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("正常な入力なら201でユーザーとトークンを返し、パスワードはハッシュ化して保存する", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
    vi.mocked(createUser).mockResolvedValue(createUserRow());
    vi.mocked(jwt.sign).mockReturnValue("signed-token" as never);

    const req = {
      body: { username: "太郎", email: "test@example.com", password: "password123" },
    } as Request;
    const res = createMockRes();

    await register(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(createUser).toHaveBeenCalledWith({
      username: "太郎",
      email: "test@example.com",
      passwordHash: "hashed-password",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { user: unknown; token: string };
    // password_hash がレスポンスに含まれていないことも確認する
    expect(jsonArg.user).not.toHaveProperty("password_hash");
    expect(jsonArg.token).toBe("signed-token");
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("emailかpasswordが欠けていたら400を返す", async () => {
    const req = { body: { email: "test@example.com" } } as Request;
    const res = createMockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("登録されていないメールアドレスなら401を返す(存在しないことは伝えない)", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    const req = { body: { email: "nobody@example.com", password: "password123" } } as Request;
    const res = createMockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "メールアドレスまたはパスワードが違います" });
  });

  it("パスワードが違う場合も同じ401エラーを返す", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(createUserRow());
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const req = { body: { email: "test@example.com", password: "wrongpass" } } as Request;
    const res = createMockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "メールアドレスまたはパスワードが違います" });
  });

  it("正しい認証情報なら200でユーザーとトークンを返す", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(createUserRow());
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue("signed-token" as never);

    const req = { body: { email: "test@example.com", password: "password123" } } as Request;
    const res = createMockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { user: unknown; token: string };
    expect(jsonArg.user).not.toHaveProperty("password_hash");
    expect(jsonArg.token).toBe("signed-token");
  });
});
