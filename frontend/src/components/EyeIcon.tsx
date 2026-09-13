/**
 * パスワード表示切り替えボタン用の目のアイコン。currentColorを使うので、
 * 置かれた場所の文字色にそのまま合わせられる。
 * @param visible false: 開いた目(パスワードは非表示中。押すと「表示」できることを示す)
 *   true: 斜線の入った目(パスワードは表示中。押すと「隠せる」ことを示す)
 */
export function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      {visible && (
        <line x1="3" y1="20" x2="21" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
