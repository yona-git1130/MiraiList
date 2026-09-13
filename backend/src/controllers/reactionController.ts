import { Request, Response } from "express";
import * as reactionRepository from "../repositories/reactionRepository";
import { findPostById } from "../repositories/postRepository";
import { REACTION_TYPES, ReactionType } from "../types/reaction";

/**
 * 投稿にリアクションを付ける/種類を変更するAPI(POST /api/posts/:id/reactions、要ログイン・要active)。
 * 既に別の種類でリアクション済みの場合は上書きする(1ユーザー1投稿につき1種類のみ)。
 * @param req.body.type REACTION_TYPESのいずれか
 * @returns 200: 成功 / 400: 不正な種類 / 403: 自分の投稿 / 404: 存在しない投稿
 */
export async function upsertReaction(req: Request, res: Response) {
  const postId = Number(req.params.id);
  const post = await findPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }

  // 自分の投稿には自分でリアクションを付けられないようにする
  if (post.author.id === req.user!.id) {
    return res.status(403).json({ error: "自分の投稿にはリアクションできません" });
  }

  const { type } = req.body ?? {};
  if (!REACTION_TYPES.includes(type)) {
    return res
      .status(400)
      .json({ error: `type は次のいずれかである必要があります: ${REACTION_TYPES.join(", ")}` });
  }

  await reactionRepository.upsertReaction({
    postId,
    userId: req.user!.id,
    reactionType: type as ReactionType,
  });
  res.status(200).json({ message: "リアクションを保存しました" });
}

/**
 * 自分が付けたリアクションを取り消すAPI(DELETE /api/posts/:id/reactions、要ログイン)。
 * @returns 204: 成功(元々何も付いていなくても成功扱い)
 */
export async function deleteReaction(req: Request, res: Response) {
  const postId = Number(req.params.id);
  await reactionRepository.deleteReaction({ postId, userId: req.user!.id });
  res.status(204).send();
}

/**
 * みんなのリスト(リアクション数ランキング)を取得するAPI(GET /api/posts/ranking、ログイン不要)。
 * @param req.query.tagId 指定するとそのタグの投稿だけに絞り込む(省略時は全タグ対象)
 * @param req.query.achieved "true"なら達成済みの投稿だけに絞り込む
 * @returns ランキング一覧(非公開投稿・管理者削除済みの投稿は除外される)
 */
export async function getRanking(req: Request, res: Response) {
  // tagId省略時は「すべて」タブとして、タグを問わず全投稿を対象にする
  let tagId: number | undefined;
  if (req.query.tagId !== undefined) {
    tagId = Number(req.query.tagId);
    if (!Number.isInteger(tagId) || tagId <= 0) {
      return res.status(400).json({ error: "tagId は正の整数で指定してください" });
    }
  }

  const achievedOnly = req.query.achieved === "true";

  // 存在しないtagIdを渡された場合は、JOINの時点で該当なし(空配列)になるだけなので
  // ここで個別にタグの存在チェックはしていない
  const ranking = await reactionRepository.getRanking(tagId, undefined, achievedOnly);
  res.json({ ranking });
}

/**
 * ログイン中のユーザーが指定の投稿に付けているリアクションを取得するAPI
 * (GET /api/posts/:id/reactions/me相当、要ログイン)。
 * @returns 200: `{ reactionType }` (未リアクションならnull)
 */
export async function getMyReaction(req: Request, res: Response) {
  const postId = Number(req.params.id);
  const reactionType = await reactionRepository.getUserReaction(postId, req.user!.id);
  res.json({ reactionType });
}
