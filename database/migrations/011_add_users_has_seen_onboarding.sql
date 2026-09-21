-- ヘッダーのナビゲーションをツールチップで説明する、初回ログイン向けオンボーディングの表示済みフラグ。
-- 既存ユーザーに今さら表示したくないのでデフォルトはtrue、新規登録時だけfalseで作成する
-- (createUser側のINSERT文で明示的にfalseを指定している)。
ALTER TABLE users ADD COLUMN has_seen_onboarding BOOLEAN NOT NULL DEFAULT true;
