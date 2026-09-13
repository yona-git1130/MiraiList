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

// ログイン・新規登録・アカウント編集で使う、表示/非表示を切り替えられるパスワード入力欄。
// 各画面で同じトグルロジックを書かなくて済むように共通コンポーネント化している。
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
