import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { PostCard } from "../components/PostCard";
import { listPostsRequest } from "../api/posts";
import { listTagsRequest } from "../api/tags";
import { useFitRowScale } from "../hooks/useFitRowScale";
import type { Post } from "../types/post";
import type { Tag } from "../types/tag";

export function PostList() {
  const [tags, setTags] = useState<Tag[]>([]);
  // undefined = 絞り込みなし(すべて表示)
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
  // タグ絞り込みと「🎉達成」絞り込みは同時には使わない(どちらか一方)
  const [achievedOnly, setAchievedOnly] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // タグ一覧は最初に1回だけ取得すればよい
  useEffect(() => {
    listTagsRequest().then(({ tags }) => setTags(tags));
  }, []);

  // 投稿一覧は、絞り込み条件(selectedTagId, achievedOnly)が変わるたびに取り直す
  useEffect(() => {
    setLoading(true);
    setError(null);
    listPostsRequest({ tagId: selectedTagId, achievedOnly })
      .then(({ posts }) => setPosts(posts))
      .catch(() => setError("投稿の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [selectedTagId, achievedOnly]);

  function selectAll() {
    setSelectedTagId(undefined);
    setAchievedOnly(false);
  }

  function selectTag(tagId: number) {
    setSelectedTagId(tagId);
    setAchievedOnly(false);
  }

  function selectAchievedOnly() {
    setSelectedTagId(undefined);
    setAchievedOnly(true);
  }

  const selectedTag = tags.find((tag) => tag.id === selectedTagId);

  // タグ絞り込みの行を、みんなのリストと同じく常に投稿カードと同じ幅ぴったりに収める
  const filterRowRef = useFitRowScale<HTMLDivElement>("--tag-scale", Infinity, [tags]);

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, color: "var(--accent-ink)" }}>マイリスト</h1>
        <div className="filter-row filter-row-nowrap" ref={filterRowRef}>
          <button
            onClick={selectAll}
            className={`filter-btn${selectedTagId === undefined && !achievedOnly ? " active" : ""}`}
          >
            すべて
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => selectTag(tag.id)}
              className={`filter-btn${selectedTagId === tag.id ? " active" : ""}`}
            >
              {tag.icon} {tag.name}
            </button>
          ))}
          <button
            onClick={selectAchievedOnly}
            className={`filter-btn${achievedOnly ? " active" : ""}`}
          >
            🎉達成
          </button>
        </div>

        {loading && <p className="muted-text">読み込み中...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="empty-text">
            {achievedOnly
              ? "達成した投稿がまだありません。"
              : selectedTag
                ? `${selectedTag.name}の投稿がまだありません。`
                : "リストに追加をするとこちらに表示されます"}
          </p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
          />
        ))}
      </main>
    </>
  );
}
