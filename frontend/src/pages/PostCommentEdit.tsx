import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { getPostRequest, updatePostRequest } from "../api/posts";
import { ApiError } from "../api/client";
import { resyncAfterPaste } from "../utils/pasteSync";

// 投稿の「コメント」欄だけを変更するための専用画面。
// タイトル・タグはリスト編集画面(PostForm)側で変更する仕組みなので、ここでは触らない。
// バックエンドの更新APIはタイトル・本文・タグをまとめて送る仕様なので、
// 取得しておいたタイトル・タグをそのまま使い、コメントだけ書き換えて送信する。
export function PostCommentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [body, setBody] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPostRequest(Number(id))
      .then(({ post }) => {
        setTitle(post.title);
        setTagIds(post.tags.map((t) => t.id));
        setBody(post.body);
        setIsPrivate(post.is_private);
      })
      .catch(() => setError("投稿の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      // title, tagIds, isPrivate は取得した値のまま送り、body(コメント)だけを更新する
      const { post } = await updatePostRequest(Number(id), { title, body, tagIds, isPrivate });
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "コメントの保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="page">
          <p className="muted-text">読み込み中...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 4 }}>コメントを編集</h1>
        <p className="muted-text" style={{ marginBottom: 20 }}>{title}</p>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            コメント
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onPaste={resyncAfterPaste(setBody)}
              required
              rows={6}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-fit" disabled={submitting}>
            {submitting ? "保存中..." : "更新"}
          </button>
        </form>
      </main>
    </>
  );
}
