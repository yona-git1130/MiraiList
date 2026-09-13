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
import { postCommentsRouter } from "./commentRoutes";
import { postReactionsRouter } from "./reactionRoutes";

export const postRouter = Router();

// "/ranking" は "/:id" より前に書く。後ろに書くと "ranking" という文字列が :id として
// 解釈されてしまい(Expressは上から順にルートを照合する)、getPost に渡ってしまう。
postRouter.get("/ranking", getRanking);

postRouter.get("/", requireAuth, listPosts); // 「リスト一覧」は自分の投稿のみを返すため、ログイン必須にする
postRouter.get("/:id", getPost);
postRouter.post("/", requireAuth, requireActive, createPost);
postRouter.put("/:id", requireAuth, requireActive, updatePost);
postRouter.delete("/:id", requireAuth, requireActive, deletePost);
postRouter.patch("/:id/achieved", requireAuth, requireActive, setAchieved);
postRouter.patch("/:id/achievement-comment", requireAuth, requireActive, setAchievementComment);

postRouter.use("/:id/comments", postCommentsRouter);
postRouter.use("/:id/reactions", postReactionsRouter);
