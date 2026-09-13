import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { ReactionBar } from "../components/ReactionBar";
import { CommentSection } from "../components/CommentSection";
import { getPostRequest, deletePostRequest } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types/post";
import { EMPTY_REACTION_COUNTS } from "../types/reaction";
import { ApiError } from "../api/client";
import { formatDateTime } from "../utils/format";

/**
 * 投稿詳細画面。タイトル・タグ・本文・投稿者・リアクション・コメント欄をまとめて表示する。
 * 投稿者本人または管理者だけに編集・コメント編集・削除ボタンを見せる(UI上のガードのみ)。
 */
export function PostDetail() {
  // useParams: URLの :id 部分(例: /posts/3 の "3")を取り出す
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getPostRequest(Number(id))
      .then(({ post }) => setPost(post))
      .catch((err) => setError(err instanceof ApiError ? err.message : "投稿の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id]);

  // 「本人 or 管理者」のときだけ編集・削除ボタンを出す。
  // これはあくまでUI上の見た目の制御で、実際の防御はバックエンドの権限チェックが担っている。
  const canModify = !!post && !!user && (user.id === post.author.id || user.role === "admin");

  async function handleDelete() {
    if (!post) return;
    if (!window.confirm("この投稿を削除しますか？この操作は取り消せません。")) return;
    try {
      await deletePostRequest(post.id);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "削除に失敗しました");
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <Link to="/">← 一覧に戻る</Link>

        {loading && <p className="muted-text">読み込み中...</p>}
        {error && <p className="error-text">{error}</p>}

        {post && (
          <article className="post-detail-card" style={{ marginTop: 16 }}>
            <h1 style={{ fontSize: 28, marginBottom: 12, textWrap: "balance" }}>{post.title}</h1>
            <div className="tag-row">
              {post.tags.map((tag) => (
                <span key={tag.id} className="tag-pill">
                  {tag.icon} {tag.name}
                </span>
              ))}
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>
            <p className="card-meta" style={{ marginTop: 24 }}>
              投稿者: {post.author.username} ・ {formatDateTime(post.created_at)}
            </p>

            {canModify && (
              <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
                <Link to={`/posts/${post.id}/edit`} className="btn-text">
                  編集
                </Link>
                <Link to={`/posts/${post.id}/edit-comment`} className="btn-text">
                  コメントを編集
                </Link>
                <button onClick={handleDelete} className="btn btn-danger">
                  削除
                </button>
              </div>
            )}

            <ReactionBar
              postId={post.id}
              initialCounts={post.reaction_counts ?? EMPTY_REACTION_COUNTS}
              isOwnPost={!!user && post.author.id === user.id}
            />
            <CommentSection postId={post.id} />
          </article>
        )}
      </main>
    </>
  );
}
