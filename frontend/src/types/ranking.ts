import type { ReactionCounts } from "./reaction";
import type { Tag } from "./tag";

// タグ別ランキング1件分。種類ごとのリアクション件数(counts)を持つ
export type RankingEntry = {
  post_id: number;
  title: string;
  body: string;
  counts: ReactionCounts;
  is_achieved: boolean;
  // 達成直後のモーダルで入力した感想。未入力ならnull
  achievement_comment: string | null;
  // リアクションボタンを押せるのは他人の投稿だけなので、本人判定に使う
  author_id: number;
  // コメントとリアクションの間に投稿者名を表示するために使う
  author_username: string;
  tags: Tag[];
};
