import type { ReactionCounts } from "./reaction";

export type TagRow = {
  id: number;
  name: string;
  icon: string;
};

// 投稿一覧・詳細のレスポンスとして返す形。
// author や tags のように、複数テーブルをJOINした結果をまとめた「表示用の型」。
export type PostDetail = {
  id: number;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
  author: {
    id: number;
    username: string;
  };
  tags: TagRow[];
  // 一覧・詳細どちらでもリアクションボタンを表示できるよう、常に含める
  reaction_counts: ReactionCounts;
  // 「🎉達成」ボタンで自分の投稿を達成済みにできる
  is_achieved: boolean;
  // 管理者が「みんなのリスト」から削除した投稿かどうか(本人のリスト一覧にだけ、その旨を表示する)
  deleted_by_admin: boolean;
  // 達成した直後にモーダルで入力する感想。未入力ならnull。みんなのリストに表示される
  achievement_comment: string | null;
  // 「マイリストにだけ表示」ボタンがONの投稿かどうか。trueの間はみんなのリストに出さない
  is_private: boolean;
};

/**
 * この投稿を、このユーザーが扱ってよい(見る・編集する・削除する・コメントする等)かを判定する。
 * - 非公開(is_private)の投稿: **投稿者本人だけ**。管理者であっても、他人の非公開投稿は
 *   見ることも、編集・削除することもできない
 * - 管理者に削除された(deleted_by_admin)投稿: 投稿者本人(削除された旨を見るため)と管理者だけ
 * - それ以外(公開の投稿): ログイン済みなら誰でも
 * 画面で隠すだけでは、APIを直接叩かれると取得・操作されてしまうため、
 * 投稿に紐づくAPIはすべて、この関数で確認する。
 * @param post 対象の投稿
 * @param user ログイン中のユーザー(未ログインならundefined)
 */
export function canViewPost(
  post: PostDetail,
  user: { id: number; role: string } | undefined
): boolean {
  if (post.is_private) return !!user && post.author.id === user.id;
  if (post.deleted_by_admin) return !!user && (post.author.id === user.id || user.role === "admin");
  return true;
}
