-- 投稿を達成済みにした直後、モーダルで入力してもらう「達成した感想」を保存する列。
-- まだ感想を書いていない(またはスキップした)投稿もあるのでNULL許容にする。
ALTER TABLE posts ADD COLUMN achievement_comment TEXT;
