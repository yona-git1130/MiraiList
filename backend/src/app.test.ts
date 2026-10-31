import { describe, it, expect } from "vitest";
import express from "express";
import app from "./app";

describe("ログインなしでのアクセス", () => {
  // 画面側でログイン必須にしているだけでは、APIを直接叩かれると誰でも取得できてしまう。
  // 投稿の中身を返すAPIは、サーバー側でも、ログインなしなら401で弾かれることを確かめる。
  // (認証の確認はコントローラーの手前で行われるので、DBには一切アクセスしない)
  const PROTECTED_GET_PATHS = [
    "/api/posts/ranking", // みんなのリスト
    "/api/posts/1", // 投稿1件
    "/api/posts/1/comments", // コメント一覧
    "/api/posts", // マイリスト
  ];

  for (const path of PROTECTED_GET_PATHS) {
    it(`GET ${path} は、トークンなしだと401になる`, async () => {
      const server = app.listen(0);
      try {
        const { port } = server.address() as { port: number };
        const res = await fetch(`http://127.0.0.1:${port}${path}`);
        expect(res.status).toBe(401);
      } finally {
        server.close();
      }
    });
  }

  it("ヘルスチェックは、トークンなしでも200になる(監視・スリープ防止用)", async () => {
    const server = app.listen(0);
    try {
      const { port } = server.address() as { port: number };
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      expect(res.status).toBe(200);
    } finally {
      server.close();
    }
  });
});

describe("app の trust proxy 設定", () => {
  it("中継サーバー1段分だけを信頼する設定になっている", () => {
    expect(app.get("trust proxy")).toBe(1);
  });

  it("1段信頼の設定では、X-Forwarded-For の一番右(=直近の中継サーバーが見たアクセス元)をIPとして使う", async () => {
    // app と同じ設定の最小のExpressで、req.ip がどう決まるかを確かめる
    const probe = express();
    probe.set("trust proxy", app.get("trust proxy"));
    probe.get("/ip", (req, res) => {
      res.json({ ip: req.ip });
    });

    const server = probe.listen(0);
    try {
      const { port } = server.address() as { port: number };
      // 攻撃者が偽のIP(1.1.1.1)を先頭に付けて送り、中継サーバーが本当のアクセス元(2.2.2.2)を後ろに付けた状態
      const res = await fetch(`http://127.0.0.1:${port}/ip`, {
        headers: { "X-Forwarded-For": "1.1.1.1, 2.2.2.2" },
      });
      const body = (await res.json()) as { ip: string };

      expect(body.ip).toBe("2.2.2.2"); // 偽のIPではなく、中継サーバーが付けた方が使われる
    } finally {
      server.close();
    }
  });
});
