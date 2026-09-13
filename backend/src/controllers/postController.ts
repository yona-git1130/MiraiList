import { Request, Response } from "express";
import * as postRepository from "../repositories/postRepository";
import { listTags } from "../repositories/tagRepository";

// リクエストで送られてきたタグID配列のうち、実在するタグだけを残す。
// 存在しないIDが1つでも混ざっていたらエラーにする(不正なデータがDBに入るのを防ぐ)。
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

export async function listPosts(req: Request, res: Response) {
  const tagId = req.query.tagId !== undefined ? Number(req.query.tagId) : undefined;
  const achievedOnly = req.query.achieved === "true";
  // 「リスト一覧」はログイン中の自分の投稿だけを表示する画面なので、常に自分のuser_idで絞り込む
  const posts = await postRepository.listPosts({ tagId, authorId: req.user!.id, achievedOnly });
  res.json({ posts });
}

export async function getPost(req: Request, res: Response) {
  const post = await postRepository.findPostById(Number(req.params.id));
  if (!post) {
    return res.status(404).json({ error: "投稿が見つかりません" });
  }
  // reaction_counts は findPostById の時点で既に含まれている
  res.json({ post });
}

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

// 達成直後のモーダルで「保存」を押したときに呼ばれる。感想は空文字も許容する
// (テキストエリアを空のまま保存された場合など)。
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
