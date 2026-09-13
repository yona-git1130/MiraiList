# 未来リスト (Mirai List)

「やってみたい」を自由に書き出し、タグで整理し、達成を記録・共有できるバケットリストアプリです。

React (Vite) のSPAフロントエンドと、Node.js + Express + PostgreSQLのREST APIバックエンドで構成されています。

## 主な機能

- **投稿(リスト)の作成・編集・削除**
  - タイトル・コメント・タグ(🔥絶対実現 / 💪挑戦 / ✨楽しみ / 🌱できたらいいな)
  - 「マイリストにだけ表示」を選ぶと、みんなのリストには公開せず自分だけが見られる非公開投稿にできる
- **達成機能**
  - 「達成」ボタンで投稿を達成済みにできる(一度達成にすると取り消し不可)
  - 達成直後に感想を入力するモーダルが表示され、感想はみんなのリストにも表示される
- **マイリスト**: 自分の投稿一覧。タグ・達成状況で絞り込み可能
- **みんなのリスト**: 全ユーザーの公開投稿を、リアクション数の多い順に表示するランキング画面
- **リアクション**: 他人の投稿に🔥💪👏✨❤️の5種類から1つを付けられる(付け直すと上書き)
- **認証**: メールアドレス+パスワードでの新規登録・ログイン(JWT)
- **管理者機能**: ユーザー一覧・停止/有効化・パスワードリセット・管理者への昇格、投稿の削除

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | React 19 + TypeScript + Vite、React Router |
| バックエンド | Node.js + Express + TypeScript |
| データベース | PostgreSQL |
| 認証 | JWT(jsonwebtoken)、パスワードは bcrypt でハッシュ化 |
| 本番デプロイ先 | フロントエンド: Vercel / バックエンド: Render / DB: Supabase |

設計の背景や技術選定の理由は [docs/design.md](docs/design.md) にまとめています(実装前に書いた設計メモのため、タグの種類など一部は現在の実装と異なります)。

## フォルダ構成

```
.
├─ frontend/            # React + TypeScript(Vite)のSPA
│  └─ src/
│     ├─ components/    # 再利用可能なUI部品
│     ├─ pages/         # 画面単位のコンポーネント
│     ├─ api/           # バックエンドと通信する関数
│     ├─ hooks/         # 再利用可能なカスタムフック
│     ├─ context/       # ログイン状態など全体で共有する情報
│     └─ types/         # フロント側の型定義
│
├─ backend/             # Node.js + Express + TypeScript のREST API
│  └─ src/
│     ├─ routes/        # URLと処理の対応
│     ├─ controllers/   # リクエスト処理の入口
│     ├─ repositories/  # DBアクセス(SQL)
│     ├─ middleware/    # 認証・権限チェックなどの共通処理
│     └─ db/            # DB接続設定
│
├─ database/
│  ├─ setup.sql         # 新規DBに一度だけ流し込む、全テーブルまとめ版
│  ├─ migrations/       # テーブル作成・変更のSQLを番号順に管理
│  ├─ seeds/            # 初期データ(固定タグなど)
│  └─ run-migrations.sh # migrations + seeds をまとめて流し込むスクリプト
│
└─ docs/design.md       # 実装前に書いた設計メモ
```

## ローカル開発環境のセットアップ

### 前提条件

- Node.js
- PostgreSQL(ローカルで起動しているもの)

### 1. リポジトリを取得

```bash
git clone https://github.com/yona-git1130/idea_no_tane.git
cd idea_no_tane
```

### 2. データベースを準備

ローカルにPostgreSQLのデータベースを作成し、`database/setup.sql` を一度だけ流し込みます。

```bash
createdb ideaboard_dev
psql ideaboard_dev -f database/setup.sql
```

(すでに一部テーブルがある環境に追加の変更だけ当てたい場合は、`database/run-migrations.sh` で `migrations/` を番号順に適用してください)

### 3. バックエンドを起動

```bash
cd backend
npm install
cp .env.example .env   # 値を自分の環境に合わせて編集する
npm run dev
```

`.env` で設定する値:

| 変数名 | 説明 |
|---|---|
| `PORT` | APIサーバーのポート番号(既定 3000) |
| `DATABASE_URL` | PostgreSQLの接続文字列 |
| `JWT_SECRET` | JWT署名用の秘密鍵(本番では推測されない値にする) |
| `JWT_EXPIRES_IN` | JWTの有効期限(例: `7d`) |
| `FRONTEND_ORIGIN` | CORSで許可するフロントエンドのオリジン |

### 4. フロントエンドを起動

別のターミナルで:

```bash
cd frontend
npm install
cp .env.example .env   # 必要に応じて編集する
npm run dev
```

| 変数名 | 説明 |
|---|---|
| `VITE_API_URL` | バックエンドAPIのURL(既定 `http://localhost:3000/api`) |

起動後、`http://localhost:5173` にアクセスすると画面が表示されます。

## 本番デプロイ

- **フロントエンド(Vercel)**: `frontend/` をルートにしたプロジェクトとしてVercelに接続。`VITE_API_URL` に本番APIのURLを設定する
- **バックエンド(Render)**: リポジトリ直下の `render.yaml` を使ったBlueprintデプロイに対応。`DATABASE_URL` / `JWT_SECRET` / `FRONTEND_ORIGIN` はRenderのダッシュボードから設定する(秘密情報のためファイルには含めていない)
- **データベース(Supabase)**: SupabaseのSQL Editorで `database/setup.sql` を一度だけ実行する。無料プランは一定期間アクセスがないと自動的に一時停止するため、その場合はSupabaseのダッシュボードから再開する

`main` ブランチにpushすると、Vercel・Renderともに自動でビルド・デプロイされます。

## 主な画面

| パス | 画面 | 認証 |
|---|---|---|
| `/register` | 新規登録 | 不要 |
| `/login` | ログイン | 不要 |
| `/` | マイリスト(自分の投稿一覧) | 要ログイン |
| `/posts/new` | リストに追加 | 要ログイン |
| `/posts/:id` | 投稿詳細 | 要ログイン |
| `/posts/:id/edit` | リストを編集 | 要ログイン(本人) |
| `/ranking` | みんなのリスト | 要ログイン |
| `/account` | アカウントを編集 | 要ログイン |
| `/admin/users` | ユーザー管理 | 要管理者 |
