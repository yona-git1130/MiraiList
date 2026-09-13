import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { upsertReaction, deleteReaction, getRanking } from "./reactionController";
import * as reactionRepository from "../repositories/reactionRepository";
import { findPostById } from "../repositories/postRepository";
import type { PostDetail } from "../types/post";

vi.mock("../repositories/reactionRepository");
vi.mock("../repositories/postRepository");

function createMockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

function createPostDetail(overrides: Partial<PostDetail> = {}): PostDetail {
  return {
    id: 1,
    title: "タイトル",
    body: "本文",
    created_at: new Date(),
    updated_at: new Date(),
    author: { id: 10, username: "作者" },
    tags: [],
    reaction_counts: { empathy: 0, like: 0, great: 0, funny: 0, thoughtful: 0 },
    is_achieved: false,
    deleted_by_admin: false,
    achievement_comment: null,
    is_private: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("upsertReaction", () => {
  it("投稿が見つからなければ404を返す", async () => {
    vi.mocked(findPostById).mockResolvedValue(null);
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "user" },
      body: { type: "like" },
    } as unknown as Request;
    const res = createMockRes();

    await upsertReaction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("自分の投稿にはリアクションできない", async () => {
    vi.mocked(findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { type: "like" },
    } as unknown as Request;
    const res = createMockRes();

    await upsertReaction(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(reactionRepository.upsertReaction).not.toHaveBeenCalled();
  });

  it("不正な種類を指定すると400を返す", async () => {
    vi.mocked(findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "user" },
      body: { type: "banzai" },
    } as unknown as Request;
    const res = createMockRes();

    await upsertReaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(reactionRepository.upsertReaction).not.toHaveBeenCalled();
  });

  it("他人の投稿に正しい種類でリアクションできる", async () => {
    vi.mocked(findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "user" },
      body: { type: "like" },
    } as unknown as Request;
    const res = createMockRes();

    await upsertReaction(req, res);

    expect(reactionRepository.upsertReaction).toHaveBeenCalledWith({
      postId: 1,
      userId: 99,
      reactionType: "like",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteReaction", () => {
  it("自分のリアクションを削除する", async () => {
    const req = { params: { id: "1" }, user: { id: 99, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deleteReaction(req, res);

    expect(reactionRepository.deleteReaction).toHaveBeenCalledWith({ postId: 1, userId: 99 });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("getRanking", () => {
  it("tagIdが正の整数でなければ400を返す", async () => {
    const req = { query: { tagId: "abc" } } as unknown as Request;
    const res = createMockRes();

    await getRanking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(reactionRepository.getRanking).not.toHaveBeenCalled();
  });

  it("tagId省略時はundefinedで全件取得する", async () => {
    vi.mocked(reactionRepository.getRanking).mockResolvedValue([]);
    const req = { query: {} } as unknown as Request;
    const res = createMockRes();

    await getRanking(req, res);

    expect(reactionRepository.getRanking).toHaveBeenCalledWith(undefined, undefined, false);
  });

  it("achieved=trueを指定すると達成済みのみで絞り込む", async () => {
    vi.mocked(reactionRepository.getRanking).mockResolvedValue([]);
    const req = { query: { tagId: "2", achieved: "true" } } as unknown as Request;
    const res = createMockRes();

    await getRanking(req, res);

    expect(reactionRepository.getRanking).toHaveBeenCalledWith(2, undefined, true);
  });
});
