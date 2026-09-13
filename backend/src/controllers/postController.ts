import { Request, Response } from "express";
import * as postRepository from "../repositories/postRepository";
import { listTags } from "../repositories/tagRepository";

// リクエストで送られてきたタグID配列のうち、実在するタグだけを残す。
// 存在しないIDが1つでも混ざっていたらエラーにする(不正なデータがDBに入るのを防ぐ)。
/**
 * リクエストで送られてきたtagIdsが「数値の配列」かつ「実在するタグIDだけ」であることを検証する。
 * @param tagIds リクエストボディの生の値(型不明なのでunknown)
 * @returns 検証済みのタグID配列
 * @throws 配列でない/数値でない要素を含む/存在しないIDを含む場合、`status`プロパティ付きのErrorを投げる
 */
async function validateTagIds(tagIds: unknown): Promise<number[]> {
  if (tagIds === undefined) return [];
  if (!Array.isArray(tagIds) || !tagIds.every((t) => typeof t === "number")) {
    throw Object.assign(new Error("tagIds は数値の配列で指定してください"), { status: 400 });
  }
  const validIds = new Set((await listTags()).map((t) => t.id));
  const invalid = tagIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    throw Object.assign(new Error(`存在しないタグIDです: ${invalid.join(", ")}`), { status: 400 });
  }
  return tagIds;
}

/**
 * マイリスト(自分の投稿一覧)を取得するAPI(GET /api/posts、要ログイン)。
 * @param req.query.tagId タグでの絞り込み(省略時は全タグ対象)
 * @param req.query.achieved "true"なら達成済みの投稿だけに絞り込む
 * @returns ログイン中ユーザー自身の投稿一覧
 */
export async function listPosts(req: Request, res: Response) {
  const tagId = req.query.tagId !== undefined ? Number(req.query.tagId) : undefined;
  const achievedOnly = req.query.achieved === "true";
  // 「リスト一覧」はログイン中の自分の投稿だけを表示する画面なので、常に自分のuser_idで絞り込む
  const posts = await postRepository.listPosts({ tagId, authorId: req.user!.id, achievedOnly });
  res.json({ posts });
}

/**
 * 投稿詳細を取得するAPI(GET /api/posts/:id、ログイン不要)。
 * @returns 200: 投稿詳細(リアクション件数込み) / 404: 存在しない投稿
 */
export async function getPost(req: Request, res: Response) {
  const post = await postRepository.findPostById(Number(req.params.id));
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }
  // reaction_counts は findPostById の時点で既に含まれている
  res.json({ post });
}

/**
 * 投稿を新規作成するAPI(POST /api/posts、要ログイン・要active)。
 * @param req.body.title タイトル(必須)
 * @param req.body.body コメント本文(任意、未指定なら空文字)
 * @param req.body.tagIds 付与するタグID配列(1つ以上必須)
 * @param req.body.isPrivate trueなら「マイリストにだけ表示」の非公開投稿にする
 * @returns 201: 作成した投稿 / 400: タイトル未入力・タグ不正・タグ未選択
 */
export async function createPost(req: Request, res: Response) {
  const { title, body, tagIds, isPrivate } = req.body ?? {};

  // コメント(body)は任意項目。タイトルとタグは必須
  if (!title) {
    return res.status(400).json({ error: "title は必須です" });
  }

  let validTagIds: number[];
  try {
    validTagIds = await validateTagIds(tagIds);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return res.status(status).json({ error: (err as Error).message });
  }
  if (validTagIds.length === 0) {
    return res.status(400).json({ error: "タグを選択してください" });
  }

  const postId = await postRepository.createPost({
    userId: req.user!.id,
    title,
    body: body ?? "",
    tagIds: validTagIds,
    isPrivate: isPrivate === true,
  });
  const post = await postRepository.findPostById(postId);
  res.status(201).json({ post });
}

/**
 * 投稿を編集するAPI(PUT /api/posts/:id、投稿者本人 or 管理者)。
 * createPostと同じ項目一式(title/body/tagIds/isPrivate)を丸ごと上書きする。
 * @returns 200: 更新後の投稿 / 403: 本人でも管理者でもない / 404: 存在しない投稿
 */
export async function updatePost(req: Request, res: Response) {
  const id = Number(req.params.id);
  const post = await postRepository.findPostById(id);
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }
  // 権限チェック: 投稿者本人 か 管理者 でなければ拒否する
  if (post.author.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ error: "この投稿を編集する権限がありません" });
  }

  const { title, body, tagIds, isPrivate } = req.body ?? {};
  // コメント(body)は任意項目。タイトルとタグは必須
  if (!title) {
    return res.status(400).json({ error: "title は必須です" });
  }

  let validTagIds: number[];
  try {
    validTagIds = await validateTagIds(tagIds);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return res.status(status).json({ error: (err as Error).message });
  }
  if (validTagIds.length === 0) {
    return res.status(400).json({ error: "タグを選択してください" });
  }

  await postRepository.updatePost(id, {
    title,
    body: body ?? "",
    tagIds: validTagIds,
    isPrivate: isPrivate === true,
  });
  const updated = await postRepository.findPostById(id);
  res.json({ post: updated });
}

/**
 * 投稿を達成済みにするAPI(PATCH /api/posts/:id/achieved、投稿者本人 or 管理者)。
 * 一度達成にした投稿は取り消せない仕様のため、achieved: falseへの変更はAPI側でも拒否する。
 * @param req.body.achieved true/booleanのみ許可
 * @returns 200: 更新後の投稿 / 400: 取り消し操作 / 403: 権限なし / 404: 存在しない投稿
 */
export async function setAchieved(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { achieved } = req.body ?? {};

  if (typeof achieved !== "boolean") {
    return res.status(400).json({ error: "achieved は true/false で指定してください" });
  }

  const post = await postRepository.findPostById(id);
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }
  // 達成マークも投稿者本人(または管理者)だけが操作できる
  if (post.author.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ error: "この投稿を操作する権限がありません" });
  }
  // 一度達成にしたものは取り消せない仕様。フロント側のボタン無効化に加えてAPI側でも防ぐ
  if (post.is_achieved && !achieved) {
    return res.status(400).json({ error: "達成済みの投稿は取り消せません" });
  }

  await postRepository.setAchieved(id, achieved);
  const updated = await postRepository.findPostById(id);
  res.json({ post: updated });
}

/**
 * 達成した感想を保存するAPI(PATCH /api/posts/:id/achievement-comment、投稿者本人のみ)。
 * 達成直後のモーダルで「保存」を押したときに呼ばれる。感想は空文字も許容する
 * (テキストエリアを空のまま保存された場合など)。
 * @param req.body.comment 感想の文字列(空文字可)
 * @returns 200: 更新後の投稿 / 400: 未達成の投稿への保存 / 403: 本人以外 / 404: 存在しない投稿
 */
export async function setAchievementComment(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { comment } = req.body ?? {};

  if (typeof comment !== "string") {
    return res.status(400).json({ error: "comment は文字列で指定してください" });
  }

  const post = await postRepository.findPostById(id);
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }
  // 感想を書けるのも投稿者本人だけ
  if (post.author.id !== req.user!.id) {
    return res.status(403).json({ error: "この投稿を操作する権限がありません" });
  }
  // 達成済みでない投稿に感想だけ付けられてしまうのを防ぐ
  if (!post.is_achieved) {
    return res.status(400).json({ error: "達成済みの投稿にのみ感想を追加できます" });
  }

  await postRepository.setAchievementComment(id, comment);
  const updated = await postRepository.findPostById(id);
  res.json({ post: updated });
}

/**
 * 投稿を削除するAPI(DELETE /api/posts/:id、投稿者本人 or 管理者)。
 * 本人が削除する場合は完全削除、管理者が他人の投稿を削除する場合はソフトデリート
 * (deleted_by_adminフラグを立てるだけ)になり、投稿者本人のマイリストに
 * 「管理者により削除されました」と表示される。
 * @returns 204: 削除成功 / 403: 権限なし / 404: 存在しない投稿
 */
export async function deletePost(req: Request, res: Response) {
  const id = Number(req.params.id);
  const post = await postRepository.findPostById(id);
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }

  const isOwner = post.author.id === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "この投稿を削除する権限がありません" });
  }

  if (isOwner) {
    // 本人が自分の投稿を削除する場合は、これまで通り完全に削除する
    await postRepository.deletePost(id);
  } else {
    // 管理者が他人の投稿を削除する場合は、完全には消さず「削除済み」の印を付ける。
    // 投稿者本人が自分のリスト一覧で「管理者により削除されました」と気付けるようにするため。
    await postRepository.softDeleteByAdmin(id);
  }
  res.status(204).send(); // 204 No Content: 削除成功だが返す本文はない
}
