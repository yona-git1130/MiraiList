// DBの reaction_type ENUM と対応する値。ここで定義した配列を「正解一覧」として
// リクエストのバリデーションやランキング集計の両方で使い回す。
export const REACTION_TYPES = ["empathy", "like", "great", "funny", "thoughtful"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export type ReactionCounts = Record<ReactionType, number>;

export type RankingTag = {
  id: number;
  name: string;
  icon: string;
};

// みんなのリスト1件分。カードと同じ「種類ごとの絵文字+件数」で
// 表示できるよう、種類別の内訳(counts)を持たせている。並び順は投稿日時が新しい順。
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
  // みんなのリストで、投稿者名をコメントとリアクションの間に表示するために使う
  author_username: string;
  tags: RankingTag[];
};
