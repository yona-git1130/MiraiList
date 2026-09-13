import { useId, useState } from "react";
import { resyncAfterPaste } from "../utils/pasteSync";
import { EyeIcon } from "./EyeIcon";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  required?: boolean;
  // ブラウザやパスワードマネージャーに「これは何のパスワード欄か」を伝えるヒント。
  // 未指定だとブラウザ側が独自に推測し、保存済みの別の値で勝手に上書きしてしまうことがある。
  autoComplete?: "current-password" | "new-password";
};

/**
 * ログイン・新規登録・アカウント編集で使う、表示/非表示を切り替えられるパスワード入力欄。
 * 各画面で同じトグルロジックを書かなくて済むように共通コンポーネント化している。
 * @param label 入力欄のラベル文字列
 * @param value 現在の入力値
 * @param onChange 入力値が変わったときの更新関数
 * @param minLength 最小文字数(バリデーション用)
 * @param required 必須入力かどうか
 * @param autoComplete ブラウザ/パスワードマネージャーへのヒント("current-password"か"new-password")
 */
export function PasswordField({
  label,
  value,
  onChange,
  minLength,
  required,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="field" htmlFor={inputId}>
      {label}
      <div className="password-input">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={resyncAfterPaste(onChange)}
          minLength={minLength}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "パスワードを非表示にする" : "パスワードを表示する"}
          title={visible ? "パスワードを非表示にする" : "パスワードを表示する"}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
    </label>
  );
}
