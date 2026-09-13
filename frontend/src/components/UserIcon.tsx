/**
 * ヘッダー右端に置く、人型のユーザーアイコン。currentColorを使うので、
 * 置かれた場所の文字色(テーマの --text)にそのまま合わせられる。
 * 頭(円)と肩から下の胴体(弧)を組み合わせたシンプルな人物シルエット。
 */
export function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path
        d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
        fill="currentColor"
      />
    </svg>
  );
}
