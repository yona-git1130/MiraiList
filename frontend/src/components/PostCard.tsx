import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactionBar } from "./ReactionBar";
import { ConfirmModal } from "./ConfirmModal";
import { AchievementCommentModal } from "./AchievementCommentModal";
import { setPostAchievedRequest, setAchievementCommentRequest, deletePostRequest } from "../api/posts";
import type { Post } from "../types/post";

function excerpt(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function PostCard({ post, onDeleted }: { post: Post; onDeleted?: () => void }) {
  const { user } = useAuth();
  const isOwnPost = !!user && post.author.id === user.id;
  const [isAchieved, setIsAchieved] = useState(post.is_achieved);
  const [pending, setPending] = useState(false);
  // 達成ボタン押下時、確定前に「はい/いいえ」を選ばせるモーダルの表示状態
  const [showConfirm, setShowConfirm] = useState(false);
  // 達成が確定した直後に、感想を聞くモーダルの表示状態
  const [showCommentModal, setShowCommentModal] = useState(false);
  // 管理者に削除されたカードを、本人が完全に削除するときの処理中フラグ
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAdminDeleted() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deletePostRequest(post.id);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  // 一度達成にすると取り消せない仕様のため、まだ達成していないときだけ確認モーダルを開く
  function handleAchieveClick() {
    if (pending || isAchieved) return;
    setShowConfirm(true);
  }

  async function handleConfirmAchieve() {
    setShowConfirm(false);
    if (pending) return;
    setPending(true);
    try {
      await setPostAchievedRequest(post.id, true);
      setIsAchieved(true); // 成功したときだけ画面の表示も切り替える
      setShowCommentModal(true); // 続けて感想を聞くモーダルを開く
    } finally {
      setPending(false);
    }
  }

  async function handleSaveComment(comment: string) {
    // 感想が空のまま保存された場合はAPIを呼ばずそのまま閉じる
    if (comment.trim() !== "") {
      await setAchievementCommentRequest(post.id, comment);
    }
    setShowCommentModal(false);
  }

  // 管理者に削除された投稿は、内容やボタンを出さず「削除されました」の通知と、
  // 本人がこのカード自体を消せる「削除」ボタンだけを出す
  if (post.deleted_by_admin) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <h2 className="card-title" style={{ textDecoration: "line-through", color: "var(--muted)" }}>
              {post.title}
            </h2>
            <button
              type="button"
              onClick={handleDeleteAdminDeleted}
              disabled={deleting}
              className="btn btn-danger"
              style={{ flexShrink: 0, padding: "4px 10px", fontSize: 13 }}
            >
              削除
            </button>
          </div>
          <p style={{ color: "var(--danger)", fontWeight: 700, margin: 0 }}>
            管理者により削除されました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card${isAchieved ? " achieved" : ""}`}>
      {/* 達成マークは投稿者本人(または管理者)だけが操作できる。それ以外には無効化して見せる。
          また一度達成にしたら取り消せない仕様のため、達成済みになったボタンは押せなくする */}
      <button
        type="button"
        onClick={handleAchieveClick}
        disabled={pending || isAchieved || (!isOwnPost && user?.role !== "admin")}
        className={`achieve-btn${isAchieved ? " achieved" : ""}`}
        title={isAchieved ? "達成済み(取り消しはできません)" : "達成としてマークする"}
      >
        {isAchieved ? "🎉達成" : "達成済みにする"}
      </button>
      {showConfirm && (
        <ConfirmModal
          message="達成ボタンの取り消しはできません。達成済みにしますか？"
          onConfirm={handleConfirmAchieve}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showCommentModal && (
        <AchievementCommentModal
          onSave={handleSaveComment}
          onClose={() => setShowCommentModal(false)}
        />
      )}
      <div className="card-body">
        {/* リアクションボタン(button)をリンクの中に入れると、押した時にカード自体の
            リンク遷移も一緒に発火してしまうため、クリックできる領域はここで分離している。
            リスト一覧は自分の投稿だけなので、詳細画面を経由せず直接編集画面へ遷移させる */}
        <Link to={`/posts/${post.id}/edit`} className="card-link">
          <div className="tag-title-row">
            {post.tags.map((tag) => (
              <span key={tag.id} className="tag-pill">
                {tag.icon} {tag.name}
              </span>
            ))}
            <h2 className="card-title">{post.title}</h2>
          </div>
          <p className="card-excerpt">{excerpt(post.body)}</p>
          {/* 達成直後のモーダルで入力された感想。書かれている投稿だけ表示する */}
          {post.achievement_comment && (
            <div className="achievement-comment">
              <p className="achievement-comment-label">🎉達成した感想</p>
              <p className="achievement-comment-text">{post.achievement_comment}</p>
            </div>
          )}
          <p className="card-meta">
            {post.author.username} ・ {formatDate(post.created_at)}
          </p>
        </Link>
        <ReactionBar
          postId={post.id}
          initialCounts={post.reaction_counts}
          isOwnPost={isOwnPost}
          showCounts={false}
        />
      </div>
    </div>
  );
}
