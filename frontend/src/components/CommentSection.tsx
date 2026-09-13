import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listCommentsRequest, createCommentRequest, deleteCommentRequest } from "../api/comments";
import type { Comment } from "../types/comment";
import { ApiError } from "../api/client";
import { resyncAfterPaste } from "../utils/pasteSync";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 投稿詳細画面のコメント欄。一覧表示・投稿・削除をまとめて扱う。
 * 未ログイン時は投稿フォームの代わりにログイン導線を表示する。
 * @param postId コメント対象の投稿ID
 */
export function CommentSection({ postId }: { postId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listCommentsRequest(postId)
      .then(({ comments }) => setComments(comments))
      .finally(() => setLoading(false));
  }

  useEffect(load, [postId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCommentRequest(postId, body);
      setBody("");
      load(); // 投稿後、一覧を取り直して最新のコメントを反映する
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "コメントの投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: number) {
    if (!window.confirm("このコメントを削除しますか？")) return;
    await deleteCommentRequest(commentId);
    load();
  }

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>コメント</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="form" style={{ marginBottom: 16 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onPaste={resyncAfterPaste(setBody)}
            rows={3}
            placeholder="コメントを入力..."
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting || !body.trim()}>
            {submitting ? "送信中..." : "コメント"}
          </button>
        </form>
      ) : (
        <p className="muted-text">
          <Link to="/login">ログイン</Link>するとコメントできます。
        </p>
      )}

      {loading && <p className="muted-text">読み込み中...</p>}
      {!loading && comments.length === 0 && <p className="empty-text">まだコメントがありません。</p>}
      {comments.map((comment) => {
        const canDelete = !!user && (user.id === comment.author.id || user.role === "admin");
        return (
          <div key={comment.id} className="comment">
            <p className="comment-body">{comment.body}</p>
            <p className="comment-meta">
              {comment.author.username} ・ {formatDateTime(comment.created_at)}
              {canDelete && (
                <button onClick={() => handleDelete(comment.id)} className="btn-text danger">
                  削除
                </button>
              )}
            </p>
          </div>
        );
      })}
    </section>
  );
}
