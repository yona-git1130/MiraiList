import { Router } from "express";
import { upsertReaction, deleteReaction, getMyReaction } from "../controllers/reactionController";
import { requireAuth, requireActive } from "../middleware/authMiddleware";
import { writeRateLimiter } from "../middleware/rateLimiter";

// postRouter 側で "/api/posts/:id/reactions" にマウントする用
export const postReactionsRouter = Router({ mergeParams: true });
postReactionsRouter.get("/me", requireAuth, getMyReaction);
postReactionsRouter.post("/", requireAuth, requireActive, writeRateLimiter, upsertReaction);
postReactionsRouter.delete("/", requireAuth, writeRateLimiter, deleteReaction);
