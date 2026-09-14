import rateLimit from "express-rate-limit";

/**
 * ログイン・新規登録の総当たり攻撃(ブルートフォース)を防ぐためのレート制限。
 * 同じIPからの試行を一定時間内で制限し、それ以上は429(Too Many Requests)で拒否する。
 * ログイン成功時はカウントをリセットする(正規ユーザーが連続でブロックされないように)。
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  limit: 20, // 同一IPからのウィンドウ内リクエスト上限
  standardHeaders: true, // RateLimit-* レスポンスヘッダーを付与する
  legacyHeaders: false, // 非推奨のX-RateLimit-*ヘッダーは付けない
  skipSuccessfulRequests: true, // 成功したログイン・登録はカウントしない(失敗の連続だけを見る)
  message: { error: "試行回数が多すぎます。しばらく時間をおいてから再度お試しください" },
});
