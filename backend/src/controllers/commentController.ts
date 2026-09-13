import { Request, Response } from "express";
import * as commentRepository from "../repositories/commentRepository";
import { findPostById } from "../repositories/postRepository";

/**
 * 投稿へのコメント一覧を取得するAPI(GET /api/posts/:id/comments、ログイン不要)。
 * @returns 投稿日時の昇順に並んだコメント一覧
 */
export async function listComments(req: Request, res: Response) {
  const postId = Number(req.params.id);
  const comments = await commentRepository.listCommentsByPost(postId);
  res.json({ comments });
}

/**
 * 投稿にコメントを付けるAPI(POST /api/posts/:id/comments、要ログイン・要active)。
 * @param req.body.body コメント本文(必須)
 * @returns 201: 作成したコメント / 400: 本文未入力 / 404: 存在しない投稿
 */
export async function createComment(req: Request, res: Response) {
  const postId = Number(req.params.id);
  const post = await findPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }

  const { body } = req.body ?? {};
  if (!body) {
    return res.status(400).json({ error: "body は必須です" });
  }

  const commentId = await commentRepository.createComment({
    postId,
    userId: req.user!.id,
    body,
  });
  const comment = await commentRepository.findCommentById(commentId);
  res.status(201).json({ comment });
}

/**
 * コメントを削除するAPI(DELETE /api/comments/:id、投稿者本人 or 管理者)。
 * @returns 204: 削除成功 / 403: 権限なし / 404: 存在しないコメント
 */
export async function deleteComment(req: Request, res: Response) {
  const id = Number(req.params.id);
  const comment = await commentRepository.findCommentById(id);
  if (!comment) {
    return res.status(404).json({ error: "コメントが見つかりません" });
  }
  // 権限チェック: コメント投稿者本人 か 管理者 でなければ拒否する
  if (comment.author.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ error: "このコメントを削除する権限がありません" });
  }

  await commentRepository.deleteComment(id);
  res.status(204).send();
}
