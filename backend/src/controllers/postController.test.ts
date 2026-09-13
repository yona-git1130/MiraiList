import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import {
  createPost,
  updatePost,
  setAchieved,
  setAchievementComment,
  deletePost,
} from "./postController";
import * as postRepository from "../repositories/postRepository";
import { listTags } from "../repositories/tagRepository";
import type { PostDetail } from "../types/post";

vi.mock("../repositories/postRepository");
vi.mock("../repositories/tagRepository");

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

const TAGS = [
  { id: 1, name: "絶対実現", icon: "🔥" },
  { id: 2, name: "挑戦", icon: "💪" },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listTags).mockResolvedValue(TAGS);
});

describe("createPost", () => {
  it("titleがなければ400を返す", async () => {
    const req = { body: { tagIds: [1] } } as Request;
    const res = createMockRes();

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(postRepository.createPost).not.toHaveBeenCalled();
  });

  it("存在しないtagIdが含まれていたら400を返す", async () => {
    const req = { body: { title: "タイトル", tagIds: [999] } } as Request;
    const res = createMockRes();

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(postRepository.createPost).not.toHaveBeenCalled();
  });

  it("tagIdsが空配列なら「タグを選択してください」で400を返す", async () => {
    const req = { body: { title: "タイトル", tagIds: [] } } as Request;
    const res = createMockRes();

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "タグを選択してください" });
  });

  it("正常な入力なら201で作成した投稿を返す", async () => {
    vi.mocked(postRepository.createPost).mockResolvedValue(1);
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail());

    const req = {
      user: { id: 10, role: "user" },
      body: { title: "タイトル", body: "本文", tagIds: [1], isPrivate: true },
    } as Request;
    const res = createMockRes();

    await createPost(req, res);

    expect(postRepository.createPost).toHaveBeenCalledWith({
      userId: 10,
      title: "タイトル",
      body: "本文",
      tagIds: [1],
      isPrivate: true,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("isPrivateを省略した場合はfalse扱いになる", async () => {
    vi.mocked(postRepository.createPost).mockResolvedValue(1);
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail());

    const req = {
      user: { id: 10, role: "user" },
      body: { title: "タイトル", tagIds: [1] },
    } as Request;
    const res = createMockRes();

    await createPost(req, res);

    expect(postRepository.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: false })
    );
  });
});

describe("updatePost", () => {
  it("投稿が存在しなければ404を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(null);
    const req = { params: { id: "1" }, user: { id: 10, role: "user" }, body: {} } as unknown as Request;
    const res = createMockRes();

    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("本人でも管理者でもなければ403を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "user" },
      body: { title: "新タイトル", tagIds: [1] },
    } as unknown as Request;
    const res = createMockRes();

    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(postRepository.updatePost).not.toHaveBeenCalled();
  });

  it("管理者なら本人でなくても編集できる", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "admin" },
      body: { title: "新タイトル", tagIds: [1] },
    } as unknown as Request;
    const res = createMockRes();

    await updatePost(req, res);

    expect(postRepository.updatePost).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it("本人なら編集でき、isPrivateも渡した値で更新される", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { title: "新タイトル", body: "新本文", tagIds: [1, 2], isPrivate: true },
    } as unknown as Request;
    const res = createMockRes();

    await updatePost(req, res);

    expect(postRepository.updatePost).toHaveBeenCalledWith(1, {
      title: "新タイトル",
      body: "新本文",
      tagIds: [1, 2],
      isPrivate: true,
    });
  });
});

describe("setAchieved", () => {
  it("achievedが真偽値でなければ400を返す", async () => {
    const req = { params: { id: "1" }, body: { achieved: "yes" } } as unknown as Request;
    const res = createMockRes();

    await setAchieved(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(postRepository.setAchieved).not.toHaveBeenCalled();
  });

  it("投稿が見つからなければ404を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(null);
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { achieved: true },
    } as unknown as Request;
    const res = createMockRes();

    await setAchieved(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("本人でも管理者でもなければ403を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "user" },
      body: { achieved: true },
    } as unknown as Request;
    const res = createMockRes();

    await setAchieved(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("達成済みの投稿を取り消そうとすると400を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(
      createPostDetail({ author: { id: 10, username: "作者" }, is_achieved: true })
    );
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { achieved: false },
    } as unknown as Request;
    const res = createMockRes();

    await setAchieved(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "達成済みの投稿は取り消せません" });
    expect(postRepository.setAchieved).not.toHaveBeenCalled();
  });

  it("未達成の投稿を達成にするのは成功する", async () => {
    vi.mocked(postRepository.findPostById)
      .mockResolvedValueOnce(createPostDetail({ author: { id: 10, username: "作者" }, is_achieved: false }))
      .mockResolvedValueOnce(createPostDetail({ author: { id: 10, username: "作者" }, is_achieved: true }));
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { achieved: true },
    } as unknown as Request;
    const res = createMockRes();

    await setAchieved(req, res);

    expect(postRepository.setAchieved).toHaveBeenCalledWith(1, true);
    expect(res.status).not.toHaveBeenCalledWith(400);
  });
});

describe("setAchievementComment", () => {
  it("commentが文字列でなければ400を返す", async () => {
    const req = { params: { id: "1" }, body: { comment: 123 } } as unknown as Request;
    const res = createMockRes();

    await setAchievementComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("投稿者本人でなければ403を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(
      createPostDetail({ author: { id: 10, username: "作者" }, is_achieved: true })
    );
    const req = {
      params: { id: "1" },
      user: { id: 99, role: "admin" },
      body: { comment: "感想" },
    } as unknown as Request;
    const res = createMockRes();

    await setAchievementComment(req, res);

    // 管理者であっても、感想は投稿者本人にしか書けない
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("達成済みでない投稿には400を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(
      createPostDetail({ author: { id: 10, username: "作者" }, is_achieved: false })
    );
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { comment: "感想" },
    } as unknown as Request;
    const res = createMockRes();

    await setAchievementComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(postRepository.setAchievementComment).not.toHaveBeenCalled();
  });

  it("本人・達成済みなら感想を保存できる", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(
      createPostDetail({ author: { id: 10, username: "作者" }, is_achieved: true })
    );
    const req = {
      params: { id: "1" },
      user: { id: 10, role: "user" },
      body: { comment: "嬉しい" },
    } as unknown as Request;
    const res = createMockRes();

    await setAchievementComment(req, res);

    expect(postRepository.setAchievementComment).toHaveBeenCalledWith(1, "嬉しい");
  });
});

describe("deletePost", () => {
  it("投稿が見つからなければ404を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(null);
    const req = { params: { id: "1" }, user: { id: 10, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deletePost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("本人でも管理者でもなければ403を返す", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = { params: { id: "1" }, user: { id: 99, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deletePost(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(postRepository.deletePost).not.toHaveBeenCalled();
    expect(postRepository.softDeleteByAdmin).not.toHaveBeenCalled();
  });

  it("本人が削除すると完全に削除される", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = { params: { id: "1" }, user: { id: 10, role: "user" } } as unknown as Request;
    const res = createMockRes();

    await deletePost(req, res);

    expect(postRepository.deletePost).toHaveBeenCalledWith(1);
    expect(postRepository.softDeleteByAdmin).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("管理者が他人の投稿を削除するとソフトデリートになる", async () => {
    vi.mocked(postRepository.findPostById).mockResolvedValue(createPostDetail({ author: { id: 10, username: "作者" } }));
    const req = { params: { id: "1" }, user: { id: 99, role: "admin" } } as unknown as Request;
    const res = createMockRes();

    await deletePost(req, res);

    expect(postRepository.softDeleteByAdmin).toHaveBeenCalledWith(1);
    expect(postRepository.deletePost).not.toHaveBeenCalled();
  });
});
