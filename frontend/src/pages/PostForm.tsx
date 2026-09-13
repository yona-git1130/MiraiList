import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { createPostRequest, updatePostRequest, getPostRequest } from "../api/posts";
import { listTagsRequest } from "../api/tags";
import type { Tag } from "../types/tag";
import { ApiError } from "../api/client";
import { resyncAfterPaste } from "../utils/pasteSync";

// 作成画面(/posts/new)と編集画面(/posts/:id/edit)を1つのコンポーネントで兼用する。
// URLに :id があるかどうかで「編集モードかどうか」を判定する。
export function PostForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  // ONにすると、みんなのリストには出さず自分のマイリストにだけ表示する
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(isEdit); // 編集時は既存データを読み込むまで待つ
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTagsRequest().then(({ tags }) => setTags(tags));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      getPostRequest(Number(id))
        .then(({ post }) => {
          setTitle(post.title);
          setBody(post.body);
          setSelectedTagId(post.tags[0]?.id ?? null);
          setIsPrivate(post.is_private);
        })
        .catch(() => setError("投稿の取得に失敗しました"))
        .finally(() => setLoading(false));
    } else {
      // 編集画面から「リストに追加」画面に遷移した場合など、前の投稿の内容が
      // 残ってしまわないよう、作成モードに切り替わったタイミングで入力欄をリセットする
      setTitle("");
      setBody("");
      setSelectedTagId(null);
      setIsPrivate(false);
      setError(null);
      setLoading(false);
    }
  }, [isEdit, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    // タグは必須(タイトルはinputのrequiredで担保、コメントは任意項目)
    if (selectedTagId === null) {
      setError("タグを選択してください");
      return;
    }
    setSubmitting(true);
    try {
      const params = {
        title,
        body,
        tagIds: selectedTagId !== null ? [selectedTagId] : [],
        isPrivate,
      };
      if (isEdit) {
        await updatePostRequest(Number(id), params);
      } else {
        await createPostRequest(params);
      }
      navigate("/"); // 追加・更新どちらの後もリスト一覧へ。ここに結果が反映されて見える
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "投稿の保存に失敗しました");
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
        {isEdit && (
          <Link to="/" style={{ display: "inline-block", marginBottom: 12 }}>
            ← マイリストに戻る
          </Link>
        )}
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, color: "var(--accent-ink)" }}>
          {isEdit ? "リストを編集" : "リストに追加"}
        </h1>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            実現・挑戦・やってみたいこと
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPaste={resyncAfterPaste(setTitle)}
              required
            />
          </label>
          <label className="field">
            コメント(任意)
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onPaste={resyncAfterPaste(setBody)}
              rows={6}
            />
          </label>
          <fieldset className="tag-fieldset">
            <legend>タグ(必須)</legend>
            <div className="filter-row" style={{ marginBottom: 0 }}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`filter-btn${selectedTagId === tag.id ? " active" : ""}`}
                >
                  {tag.icon} {tag.name}
                </button>
              ))}
            </div>
          </fieldset>
          {/* マイリストにだけ表示のON/OFFは「リストに追加」時のみ選べる。
              一度追加した投稿は、この画面(編集)からは変更できない */}
          {!isEdit && (
            <div className="privacy-toggle-row">
              <button
                type="button"
                onClick={() => setIsPrivate((v) => !v)}
                className={`filter-btn${isPrivate ? " active" : ""}`}
                aria-pressed={isPrivate}
              >
                マイリストにだけ表示
              </button>
              <p className="muted-text" style={{ fontSize: 12, margin: 0 }}>
                みんなのリストには表示されず、マイリストにだけ表示されます
              </p>
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-fit"
            disabled={submitting}
            style={{ alignSelf: "center" }}
          >
            {submitting ? "保存中..." : isEdit ? "更新" : "追加"}
          </button>
        </form>
      </main>
    </>
  );
}
