import { describe, it, expect } from "vitest";
import express from "express";
import app from "./app";

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
