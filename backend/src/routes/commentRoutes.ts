import { Router } from "express";
import { listComments, createComment, deleteComment } from "../controllers/commentController";
import { requireAuth, requireActive } from "../middleware/authMiddleware";
import { writeRateLimiter } from "../middleware/rateLimiter";

// postRouter 側で "/api/posts/:id/comments" にマウントする用。
// mergeParams: true にすることで、親ルーターの :id (投稿ID) をここでも req.params.id として使える
export const postCommentsRouter = Router({ mergeParams: true });
postCommentsRouter.get("/", listComments);
postCommentsRouter.post("/", requireAuth, requireActive, writeRateLimiter, createComment);

// app.ts 側で "/api/comments" に直接マウントする用(コメント単体の削除はpostに紐付かないURLにする)
export const commentsRouter = Router();
commentsRouter.delete("/:id", requireAuth, writeRateLimiter, deleteComment);
