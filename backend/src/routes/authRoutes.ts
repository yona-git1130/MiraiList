import { Router } from "express";
import { register, login } from "../controllers/authController";
import { authRateLimiter } from "../middleware/rateLimiter";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, register);
authRouter.post("/login", authRateLimiter, login);
