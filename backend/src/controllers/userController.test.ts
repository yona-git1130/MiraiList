import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  adminDeleteUser,
  adminSetUserStatus,
  adminSetUserPassword,
  adminSetUserRole,
  completeOnboarding,
} from "./userController";
import {
  findUserById,
  setUserStatus,
  setUserRole,
  updatePassword,
  markOnboardingSeen,
} from "../repositories/userRepository";
import type { UserRow } from "../types/user";

vi.mock("bcrypt");
vi.mock("../repositories/userRepository");

function createMockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

function createUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 2,
    username: "一般ユーザー",
    email: "user@example.com",
    password_hash: "hashed",
    role: "user",
    status: "active",
    created_at: new Date(),
    has_seen_onboarding: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("adminDeleteUser", () => {
  it("自分自身は削除できない", async () => {
    const req = { params: { id: "1" }, user: { id: 1, role: "admin" } } as unknown as Request;
    const res = createMockRes();

    await adminDeleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(findUserById).not.toHaveBeenCalled();
  });

  it("対象が存在しなければ404を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);
    const req = { params: { id: "2" }, user: { id: 1, role: "admin" } } as unknown as Request;
    const res = createMockRes();

    await adminDeleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("正常に削除できる", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow());
    const req = { params: { id: "2" }, user: { id: 1, role: "admin" } } as unknown as Request;
    const res = createMockRes();

    await adminDeleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("adminSetUserStatus", () => {
  it("statusがactive/suspended以外なら400を返す", async () => {
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { status: "banned" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(setUserStatus).not.toHaveBeenCalled();
  });

  it("自分自身の状態は変更できない", async () => {
    const req = {
      params: { id: "1" },
      user: { id: 1, role: "admin" },
      body: { status: "suspended" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(setUserStatus).not.toHaveBeenCalled();
  });

  it("対象が存在しなければ404を返す", async () => {
    vi.mocked(setUserStatus).mockResolvedValue(null);
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { status: "suspended" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("正常に停止できる", async () => {
    vi.mocked(setUserStatus).mockResolvedValue(createUserRow({ status: "suspended" }));
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { status: "suspended" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserStatus(req, res);

    expect(setUserStatus).toHaveBeenCalledWith(2, "suspended");
    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(404);
  });
});

describe("adminSetUserPassword", () => {
  it("新しいパスワードが8文字未満なら400を返す", async () => {
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { newPassword: "short" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("自分自身のパスワードはこのAPIでは変更できない", async () => {
    const req = {
      params: { id: "1" },
      user: { id: 1, role: "admin" },
      body: { newPassword: "password123" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(findUserById).not.toHaveBeenCalled();
  });

  it("対象が存在しなければ404を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { newPassword: "password123" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("対象が管理者なら403を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow({ role: "admin" }));
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { newPassword: "password123" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("一般ユーザーなら正常にパスワードを変更できる", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow({ role: "user" }));
    vi.mocked(bcrypt.hash).mockResolvedValue("new-hashed" as never);
    const req = {
      params: { id: "2" },
      user: { id: 1, role: "admin" },
      body: { newPassword: "password123" },
    } as unknown as Request;
    const res = createMockRes();

    await adminSetUserPassword(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(updatePassword).toHaveBeenCalledWith(2, "new-hashed");
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("completeOnboarding", () => {
  it("自分自身のidでmarkOnboardingSeenを呼び、204を返す", async () => {
    const req = { user: { id: 1, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await completeOnboarding(req, res);

    expect(markOnboardingSeen).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("adminSetUserRole", () => {
  it("対象が存在しなければ404を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);
    const req = { params: { id: "2" } } as unknown as Request;
    const res = createMockRes();

    await adminSetUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(setUserRole).not.toHaveBeenCalled();
  });

  it("既に管理者なら400を返す", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow({ role: "admin" }));
    const req = { params: { id: "2" } } as unknown as Request;
    const res = createMockRes();

    await adminSetUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "すでに管理者です" });
    expect(setUserRole).not.toHaveBeenCalled();
  });

  it("一般ユーザーなら管理者に昇格できる", async () => {
    vi.mocked(findUserById).mockResolvedValue(createUserRow({ role: "user" }));
    vi.mocked(setUserRole).mockResolvedValue(createUserRow({ role: "admin" }));
    const req = { params: { id: "2" } } as unknown as Request;
    const res = createMockRes();

    await adminSetUserRole(req, res);

    expect(setUserRole).toHaveBeenCalledWith(2, "admin");
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { user: { role: string } };
    expect(jsonArg.user.role).toBe("admin");
  });
});
