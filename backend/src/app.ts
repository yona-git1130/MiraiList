// app.ts: Expressアプリの「組み立て」だけを行うファイル。
// ここでは app.listen() を呼ばない(=実際にポートを開いて待ち受けを始めない)。
// こうしておくと、将来テストコードから「起動はせずにappだけ使う」ことができる。

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/authRoutes";
import { userRouter } from "./routes/userRoutes";
import { postRouter } from "./routes/postRoutes";
import { tagRouter } from "./routes/tagRoutes";
import { commentsRouter } from "./routes/commentRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// helmet: HSTS・X-Content-Type-Options・X-Frame-Optionsなど、
// セキュリティ関連のレスポンスヘッダーをまとめて適切な値に設定してくれるミドルウェア。
// このAPIはブラウザから直接HTMLとして表示されることはないので、
// フロントエンド側のCSPと衝突しないようcontentSecurityPolicyは無効にしている。
app.use(helmet({ contentSecurityPolicy: false }));

// CORS(Cross-Origin Resource Sharing): ブラウザは標準では「今開いているページと
// 別のオリジン(ドメイン+ポート)」への通信をブロックする。フロントエンド(localhost:5173)から
// バックエンド(localhost:3000)を呼べるように、許可するオリジンを明示的に指定する。
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));

app.use(express.json()); // リクエストボディのJSONを自動でパースするミドルウェア

// 動作確認用のヘルスチェックAPI。サーバーが生きているかを確認するための定番エンドポイント
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter); // /api/auth/register, /api/auth/login
app.use("/api/users", userRouter); // /api/users/me
app.use("/api/posts", postRouter);
app.use("/api/tags", tagRouter);
app.use("/api/comments", commentsRouter); // DELETE /api/comments/:id

// エラーハンドラは必ず全てのルートより後ろに登録する(Expressのルール)
app.use(errorHandler);

export default app;
