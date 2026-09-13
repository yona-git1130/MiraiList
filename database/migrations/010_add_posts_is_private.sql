-- 「マイリストにだけ表示」ボタンをONにして投稿されたものかどうか。
-- trueの投稿はみんなのリスト(ランキング)には出さず、投稿者本人のマイリストにだけ表示する。
ALTER TABLE posts ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
