// サーバー起動時に、動作に必須の環境変数がすべて揃っているかを確認するためのチェック。

const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_ORIGIN"] as const;

/**
 * 必須の環境変数が未設定のまま起動していないかを確認する。
 * 未設定のまま起動を続けてしまうと、DB接続時やJWT発行時など実際にその機能が
 * 呼ばれた瞬間になって初めてわかりにくいエラーで落ちてしまうため、
 * 起動時にまとめてチェックし、不足があればすぐに気づけるようにする。
 * 不足がある場合は、何が足りないかをコンソールに出してプロセスを終了する。
 */
export function checkRequiredEnvVars(): void {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `起動に必要な環境変数が設定されていません: ${missing.join(", ")}\n` +
        ".env ファイル(.env.example を参考に作成してください)を確認してください。"
    );
    process.exit(1);
  }
}
