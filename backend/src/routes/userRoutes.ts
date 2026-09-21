import { Router } from "express";
import {
  getMe,
  updateMe,
  completeOnboarding,
  adminListUsers,
  adminDeleteUser,
  adminSetUserStatus,
  adminSetUserPassword,
  adminSetUserRole,
} from "../controllers/userController";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware";

export const userRouter = Router();

userRouter.get("/me", requireAuth, getMe); // requireAuth を経由してからでないと getMe に到達しない
userRouter.patch("/me", requireAuth, updateMe);
userRouter.patch("/me/onboarding", requireAuth, completeOnboarding);

// ここから下は管理者専用。requireAuthでログインを確認したあと、requireAdminでroleをチェックする
userRouter.get("/", requireAuth, requireAdmin, adminListUsers);
userRouter.delete("/:id", requireAuth, requireAdmin, adminDeleteUser);
userRouter.patch("/:id/suspend", requireAuth, requireAdmin, adminSetUserStatus);
userRouter.patch("/:id/password", requireAuth, requireAdmin, adminSetUserPassword);
userRouter.patch("/:id/role", requireAuth, requireAdmin, adminSetUserRole);
