import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { createComment, deleteComment } from "./commentController";
import * as commentRepository from "../repositories/commentRepository";
import { findPostById } from "../repositories/postRepository";
import type { PostDetail } from "../types/post";
import type { CommentDetail } from "../repositories/commentRepository";

vi.mock("../repositories/commentRepository");
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

function createCommentDetail(overrides: Partial<CommentDetail> = {}): CommentDetail {
  return {
    id: 1,
    post_id: 1,
    body: "コメント",
    created_at: new Date(),
    author: { id: 10, username: "投稿者" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createComment", () => {
  it("投稿が存在しなければ404を返す", async () => {
    vi.mocked(findPostById).mockResolvedValue(null);
    const req = {
      params: { id: "1" },
      user: { id: 1, role: "user" },
      body: { body: "コメント" },
    } as unknown as Request;
    const res = createMockRes();

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("bodyが空なら400を返す", async () => {
    vi.mocked(findPostById).mockResolvedValue(createPostDetail());
    const req = {
      params: { id: "1" },
      user: { id: 1, role: "user" },
      body: {},
    } as unknown as Request;
    const res = createMockRes();

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(commentRepository.createComment).not.toHaveBeenCalled();
  });

  it("正常な入力なら201でコメントを返す", async () => {
    vi.mocked(findPostById).mockResolvedValue(createPostDetail());
    vi.mocked(commentRepository.createComment).mockResolvedValue(5);
    vi.mocked(commentRepository.findCommentById).mockResolvedValue(
      createCommentDetail({ id: 5, author: { id: 1, username: "太郎" } })
    );
    const req = {
      params: { id: "1" },
      user: { id: 1, role: "user" },
      body: { body: "コメント" },
    } as unknown as Request;
    const res = createMockRes();

    await createComment(req, res);

    expect(commentRepository.createComment).toHaveBeenCalledWith({
      postId: 1,
      userId: 1,
      body: "コメント",
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("deleteComment", () => {
  it("コメントが存在しなければ404を返す", async () => {
    vi.mocked(commentRepository.findCommentById).mockResolvedValue(null);
    const req = { params: { id: "1" }, user: { id: 1, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("投稿者本人でも管理者でもなければ403を返す", async () => {
    vi.mocked(commentRepository.findCommentById).mockResolvedValue(createCommentDetail());
    const req = { params: { id: "1" }, user: { id: 99, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(commentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it("投稿者本人なら削除できる", async () => {
    vi.mocked(commentRepository.findCommentById).mockResolvedValue(createCommentDetail());
    const req = { params: { id: "1" }, user: { id: 10, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deleteComment(req, res);

    expect(commentRepository.deleteComment).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("管理者なら他人のコメントも削除できる", async () => {
    vi.mocked(commentRepository.findCommentById).mockResolvedValue(createCommentDetail());
    const req = { params: { id: "1" }, user: { id: 99, role: "admin" } } as unknown as Request;
    const res = createMockRes();

    await deleteComment(req, res);

    expect(commentRepository.deleteComment).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
