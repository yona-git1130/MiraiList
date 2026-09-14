// server.ts: 組み立てた app を実際に起動するエントリーポイント

import "dotenv/config"; // .env ファイルの中身を process.env に読み込む
import app from "./app";
import { checkRequiredEnvVars } from "./config/checkEnv";

checkRequiredEnvVars(); // 必須の環境変数が欠けていたら、ここで早期に気づいて起動を止める

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
