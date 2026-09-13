-- Supabase の SQL Editor で、このファイル全体を一度だけ実行してください。
-- 新規・空のデータベース用です。すでにテーブルを作成した環境では実行しないでください。

BEGIN;

-- users
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended');

CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tags
CREATE TABLE tags (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL
);

-- posts
CREATE TABLE posts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_achieved BOOLEAN NOT NULL DEFAULT false,
  deleted_by_admin BOOLEAN NOT NULL DEFAULT false,
  achievement_comment TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

-- post_tags
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- comments
CREATE TABLE comments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON comments (post_id);

-- reactions
CREATE TYPE reaction_type AS ENUM ('empathy', 'like', 'great', 'funny', 'thoughtful');

CREATE TABLE reactions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_reactions_post_id ON reactions (post_id);

-- 初期タグ
INSERT INTO tags (name, icon) VALUES
  ('絶対実現', '🔥'),
  ('挑戦', '💪'),
  ('楽しみ', '✨'),
  ('できたらいいな', '🌱');

COMMIT;
