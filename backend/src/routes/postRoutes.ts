import { Router } from "express";
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  setAchieved,
  setAchievementComment,
} from "../controllers/postController";
import { getRanking } from "../controllers/reactionController";
import { requireAuth, requireActive } from "../middleware/authMiddleware";
import { writeRateLimiter } from "../middleware/rateLimiter";
import { postCommentsRouter } from "./commentRoutes";
import { postReactionsRouter } from "./reactionRoutes";

export const postRouter = Router();

// "/ranking" は "/:id" より前に書く。後ろに書くと "ranking" という文字列が :id として
// 解釈されてしまい(Expressは上から順にルートを照合する)、getPost に渡ってしまう。
// 画面側でログイン必須にしているだけでは、APIを直接叩かれると誰でも取得できてしまう。
// そのため、投稿を返すAPIはサーバー側でもログイン必須にする(非公開の投稿の中身は、
// さらにコントローラー側で、投稿者本人と管理者以外に返さないようにしている)。
postRouter.get("/ranking", requireAuth, getRanking);

postRouter.get("/", requireAuth, listPosts); // 「リスト一覧」は自分の投稿のみを返すため、ログイン必須にする
postRouter.get("/:id", requireAuth, getPost);
postRouter.post("/", requireAuth, requireActive, writeRateLimiter, createPost);
postRouter.put("/:id", requireAuth, requireActive, writeRateLimiter, updatePost);
postRouter.delete("/:id", requireAuth, requireActive, writeRateLimiter, deletePost);
postRouter.patch("/:id/achieved", requireAuth, requireActive, writeRateLimiter, setAchieved);
postRouter.patch(
  "/:id/achievement-comment",
  requireAuth,
  requireActive,
  writeRateLimiter,
  setAchievementComment
);

postRouter.use("/:id/comments", postCommentsRouter);
postRouter.use("/:id/reactions", postReactionsRouter);
