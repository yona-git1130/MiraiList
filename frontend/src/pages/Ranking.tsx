import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { ReactionBar } from "../components/ReactionBar";
import { UserIcon } from "../components/UserIcon";
import { getRankingRequest } from "../api/ranking";
import { deletePostRequest } from "../api/posts";
import { listTagsRequest } from "../api/tags";
import { useAuth } from "../context/AuthContext";
import { useFitRowScale } from "../hooks/useFitRowScale";
import { excerpt } from "../utils/format";
import type { RankingEntry } from "../types/ranking";
import type { Tag } from "../types/tag";

/**
 * みんなのリスト画面。全ユーザーの公開投稿を一覧表示し、タグ・達成状況で絞り込める。
 * 他人の投稿にはリアクションできるが、自分の投稿は件数バッジだけの表示になる。
 * 管理者は投稿をここから直接ソフトデリートできる。
 */
export function Ranking() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  // undefined = 「すべて」(タグで絞り込まない)。リスト一覧画面の絞り込みと同じ考え方
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
  // タグ絞り込みと「🎉達成」絞り込みは同時には使わない(どちらか一方)
  const [achievedOnly, setAchievedOnly] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // タグ一覧は最初に1回だけ取得すればよい
  useEffect(() => {
    listTagsRequest().then(({ tags }) => setTags(tags));
  }, []);

  // ランキングは、絞り込み条件(selectedTagId, achievedOnly)が変わるたびに取り直す
  useEffect(() => {
    setLoading(true);
    getRankingRequest({ tagId: selectedTagId, achievedOnly })
      .then(({ ranking }) => setRanking(ranking))
      .finally(() => setLoading(false));
  }, [selectedTagId, achievedOnly]);

  const selectedTag = tags.find((tag) => tag.id === selectedTagId);

  // タグ絞り込みの行を、常に投稿カードと同じ幅ぴったりに収まる大きさに調整する
  // (余裕があれば拡大もするので、maxScaleはInfinity)
  const filterRowRef = useFitRowScale<HTMLDivElement>("--tag-scale", Infinity, [tags]);

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

  // 管理者専用: みんなのリストから直接投稿を削除する。
  // 本人による削除と違い完全には消えず、投稿者本人のリスト一覧には
  // 「管理者により削除されました」と表示される(バックエンド側のソフトデリート)。
  async function handleAdminDelete(postId: number) {
    if (!window.confirm("この投稿を削除しますか？")) return;
    await deletePostRequest(postId);
    setRanking((prev) => prev.filter((entry) => entry.post_id !== postId));
  }

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-heading" style={{ fontSize: 24, marginBottom: 20, color: "var(--accent-ink)" }}>みんなのリスト</h1>

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
        {!loading && ranking.length === 0 && (
          <p className="empty-text">
            {achievedOnly
              ? "達成した投稿がまだありません。"
              : selectedTag
                ? `${selectedTag.name}の投稿がまだありません。`
                : "投稿がまだありません。"}
          </p>
        )}

        <ol style={{ padding: 0, listStyle: "none", margin: 0 }}>
          {ranking.map((entry, index) => (
            <li key={entry.post_id} className={`rank-item${entry.is_achieved ? " achieved" : ""}`}>
              <span className="rank-number">{index + 1}</span>
              {/* minWidth: 0 がないと、中の横一列(タグ・リアクション等)に押されて
                  このflexアイテム自体がカードの幅からはみ出してしまう */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* 操作はできないので、リスト一覧のボタンと違いbuttonではなくバッジ(span)で表示のみ行う */}
                {entry.is_achieved && (
                  <span
                    className="achieve-btn achieved"
                    style={{ display: "inline-flex", marginBottom: 8 }}
                  >
                    🎉達成
                  </span>
                )}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div className="tag-title-row" style={{ marginBottom: 0 }}>
                    {entry.tags.map((tag) => (
                      <span key={tag.id} className="tag-pill">
                        {tag.icon} {tag.name}
                      </span>
                    ))}
                    <Link
                      to={`/posts/${entry.post_id}`}
                      style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}
                    >
                      {entry.title}
                    </Link>
                  </div>
                  {/* 削除ボタンは管理者にだけ表示する */}
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleAdminDelete(entry.post_id)}
                      className="btn btn-danger"
                      style={{ flexShrink: 0, padding: "4px 10px", fontSize: 13 }}
                    >
                      削除
                    </button>
                  )}
                </div>
                <p className="rank-excerpt">{excerpt(entry.body, 60)}</p>
                {/* 達成直後のモーダルで入力された感想。書かれている投稿だけ表示する */}
                {entry.achievement_comment && (
                  <div className="achievement-comment">
                    <p className="achievement-comment-label">🎉達成した感想</p>
                    <p className="achievement-comment-text">{entry.achievement_comment}</p>
                  </div>
                )}
                <p
                  className="card-meta"
                  style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}
                >
                  <UserIcon />
                  {entry.author_username}
                </p>
                {/* 他人の投稿には実際に押せるリアクションボタンを表示する。
                    自分の投稿は押せないが、他の人が付けた件数は表示だけする */}
                <ReactionBar
                  postId={entry.post_id}
                  initialCounts={entry.counts}
                  isOwnPost={!!user && user.id === entry.author_id}
                  hideForOwnPost={false}
                  fitToRow
                />
              </div>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
