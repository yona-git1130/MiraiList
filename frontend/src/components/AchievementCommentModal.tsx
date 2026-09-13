import { useState } from "react";

/**
 * 投稿を達成済みにした直後に表示する、感想入力用のモーダル。
 * 「保存」で感想を送信、右上の「×」で(何も保存せず)閉じられる。
 * @param onSave 「保存」を押したときの処理(入力した感想を渡す)
 * @param onClose 「×」または背景クリックで閉じたときの処理
 */
export function AchievementCommentModal({
  onSave,
  onClose,
}: {
  onSave: (comment: string) => void;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(comment);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <p className="modal-message">
          達成おめでとうございます！
          <br />
          感想を聞かせてください！
          <br />
          (感想はみんなのリストに表示されます)
        </p>
        <textarea
          className="modal-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="感想を入力してください"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner" aria-hidden="true" />}
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
