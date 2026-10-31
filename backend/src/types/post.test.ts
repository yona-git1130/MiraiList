import { describe, it, expect } from "vitest";
import { canViewPost } from "./post";
import type { PostDetail } from "./post";

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

const AUTHOR = { id: 10, role: "user" };
const OTHER_USER = { id: 20, role: "user" };
const ADMIN = { id: 99, role: "admin" };

describe("canViewPost", () => {
  describe("公開の投稿", () => {
    it("ログイン済みの他のユーザーは見られる", () => {
      expect(canViewPost(createPostDetail(), OTHER_USER)).toBe(true);
    });

    it("投稿者本人も管理者も見られる", () => {
      expect(canViewPost(createPostDetail(), AUTHOR)).toBe(true);
      expect(canViewPost(createPostDetail(), ADMIN)).toBe(true);
    });
  });

  describe("非公開(マイリストにだけ表示)の投稿", () => {
    const privatePost = createPostDetail({ is_private: true });

    it("他のユーザーは見られない", () => {
      expect(canViewPost(privatePost, OTHER_USER)).toBe(false);
    });

    it("未ログインでは見られない", () => {
      expect(canViewPost(privatePost, undefined)).toBe(false);
    });

    it("投稿者本人は見られる", () => {
      expect(canViewPost(privatePost, AUTHOR)).toBe(true);
    });

    it("管理者であっても、他人の非公開投稿は見られない", () => {
      expect(canViewPost(privatePost, ADMIN)).toBe(false);
    });

    it("管理者が自分で書いた非公開投稿は、自分なので見られる", () => {
      const adminsOwn = createPostDetail({ is_private: true, author: { id: 99, username: "管理人" } });
      expect(canViewPost(adminsOwn, ADMIN)).toBe(true);
    });
  });

  describe("管理者に削除された投稿", () => {
    const deletedPost = createPostDetail({ deleted_by_admin: true });

    it("他のユーザーは見られない", () => {
      expect(canViewPost(deletedPost, OTHER_USER)).toBe(false);
    });

    it("投稿者本人(削除された旨を見る)と管理者は見られる", () => {
      expect(canViewPost(deletedPost, AUTHOR)).toBe(true);
      expect(canViewPost(deletedPost, ADMIN)).toBe(true);
    });
  });
});
