import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { upsertReactionRequest, deleteReactionRequest, getMyReactionRequest } from "../api/reactions";
import { useFitRowScale } from "../hooks/useFitRowScale";
import { REACTION_TYPES, REACTION_LABELS } from "../types/reaction";
import type { ReactionType, ReactionCounts } from "../types/reaction";

/**
 * 投稿に対するリアクション(絵文字)ボタン群。押すと種類を選択/変更/取り消しできる。
 * 自分の投稿には反応できないため、表示方法をprops経由で切り替えられるようにしている。
 * @param postId リアクション対象の投稿ID
 * @param initialCounts 初期表示するリアクション種別ごとの件数
 * @param isOwnPost 自分自身の投稿かどうか(trueだと操作を無効化する)
 * @param showCounts ボタンに件数も表示するか(一覧ではfalseにしてボタンだけ見せる)
 * @param hideForOwnPost 自分の投稿のとき、何も表示しない(true)か、押せない件数バッジだけ出す(false)か
 * @param fitToRow 折り返さず常に横一列(横スクロールなし)に収めるか
 */
export function ReactionBar({
  postId,
  initialCounts,
  isOwnPost = false,
  showCounts = true,
  hideForOwnPost = true,
  fitToRow = false,
}: {
  postId: number;
  initialCounts: ReactionCounts;
  // 自分自身の投稿では、自分にリアクションを付けられないようにボタンを無効化する
  isOwnPost?: boolean;
  // 一覧画面など、件数を出さずにボタンだけ見せたい場所ではfalseにする
  showCounts?: boolean;
  // 自分の投稿のとき、何も表示しない(true, 従来の挙動)か、
  // 押せないバッジとして件数だけ表示する(false)かを選べる
  hideForOwnPost?: boolean;
  // 折り返さず常に横一列(横スクロールなし)に収める(みんなのリストで使用)
  fitToRow?: boolean;
}) {
  const { user } = useAuth();
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [pending, setPending] = useState(false);

  // 横幅に応じて縮小し、fitToRowのときは折り返さず1行に収める
  const rowRef = useFitRowScale<HTMLDivElement>("--reaction-scale", 1, [fitToRow]);
  const rowClassName = `reaction-row${fitToRow ? " reaction-row-nowrap" : ""}`;

  useEffect(() => {
    if (!user || isOwnPost) {
      setMyReaction(null);
      return;
    }
    getMyReactionRequest(postId).then(({ reactionType }) => setMyReaction(reactionType));
  }, [postId, user, isOwnPost]);

  // 自分の投稿にはそもそもリアクションを付けられない。
  // hideForOwnPost=true(既定)なら何も出さず、falseなら「他の人が押した件数」だけを
  // 操作できないバッジとして見せる(みんなのリストで使う)。
  if (isOwnPost) {
    if (hideForOwnPost) {
      return null;
    }
    return (
      <div className={rowClassName} ref={fitToRow ? rowRef : undefined}>
        {REACTION_TYPES.map((type) => (
          <span key={type} className="reaction-btn no-border">
            <span>{REACTION_LABELS[type].emoji}</span>
            <span>{counts[type]}</span>
          </span>
        ))}
      </div>
    );
  }

  async function handleClick(type: ReactionType) {
    if (!user || pending) return;
    setPending(true);
    try {
      if (myReaction === type) {
        // 押した状態のボタンをもう一度押したら、リアクションを取り消す
        await deleteReactionRequest(postId);
        setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        setMyReaction(null);
      } else {
        // 別の種類を押したら上書き。画面上のカウントも「元の種類-1、新しい種類+1」にする
        await upsertReactionRequest(postId, type);
        setCounts((prev) => {
          const next = { ...prev, [type]: prev[type] + 1 };
          if (myReaction) {
            next[myReaction] = Math.max(0, next[myReaction] - 1);
          }
          return next;
        });
        setMyReaction(type);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={rowClassName} ref={fitToRow ? rowRef : undefined}>
      {REACTION_TYPES.map((type) => {
        const active = myReaction === type;
        return (
          <button
            key={type}
            onClick={() => handleClick(type)}
            disabled={!user || pending}
            title={user ? REACTION_LABELS[type].label : "ログインするとリアクションできます"}
            className={`reaction-btn${active ? " active" : ""}`}
          >
            <span>{REACTION_LABELS[type].emoji}</span>
            {showCounts && <span>{counts[type]}</span>}
          </button>
        );
      })}
    </div>
  );
}
