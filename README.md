# Security Check Search NJ

セキュリティチェック統制管理システム — チームのセキュリティナレッジを一元管理し、チェックシートの質問に対する回答を効率的に検索・再利用するためのフルスタックアプリケーションです。

A full-stack application for managing security control knowledge — centralizing team security knowledge and efficiently searching/reusing answers for checklist questions.

---

## 技術スタック / Tech Stack

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 |
| Backend | Go 1.25 / Connect RPC v2 / Bleve (全文検索) |
| Database | PostgreSQL 16 / sqlc (型安全クエリ) |
| Infra | Google Cloud (GKE, Pub/Sub, Cloud Storage) |
| Proto | Protocol Buffers / buf CLI |

---

## 前提条件 / Prerequisites

[mise](https://mise.jdx.dev/) を使用してツールバージョンを管理しています。

This project uses [mise](https://mise.jdx.dev/) for tool version management.

| ツール / Tool | バージョン / Version | 用途 / Purpose |
|--------------|---------------------|----------------|
| Go | 1.25.6 | バックエンドサーバー |
| Node.js | 20 | フロントエンド |
| pnpm | 10.29.2 | パッケージマネージャー |
| PostgreSQL | 16+ | データベース (Docker) |
| buf | latest | Proto コード生成 |
| sqlc | latest | SQL → Go コード生成 |
| golang-migrate | latest | DB マイグレーション |
| Docker | - | PostgreSQL コンテナ |

---

## 環境構築手順 / Getting Started

### 1. リポジトリのクローン / Clone

```bash
git clone git@github.com:3-shake/security-check-search-nj.git
cd security-check-search-nj
git checkout backend
```

### 2. ツールのインストール / Install Tools

```bash
# mise でツールを一括インストール
mise trust
mise install

# フロントエンドの依存パッケージをインストール
cd frontend && pnpm install && cd ..
```

### 3. データベースの起動 / Start Database

Docker Compose で PostgreSQL を起動します。

```bash
docker compose up -d
```

> PostgreSQL はホストのポート **5433** で起動します（コンテナ内は 5432）。

### 4. 環境変数の設定 / Configure Environment

```bash
cp .env.example .env
```

必要に応じて `.env` の `DATABASE_URL` を編集してください。デフォルト値は docker-compose の設定に合わせてあります。

### 5. データベースマイグレーション / Run Migrations

```bash
make migrate-up
```

### 6. コード生成 / Generate Code

Protocol Buffers と sqlc からコードを生成します。通常はリポジトリに生成済みコードが含まれていますが、Proto/SQL を変更した場合は再生成が必要です。

```bash
make generate
```

### 7. 開発サーバーの起動 / Start Dev Servers

```bash
# バックエンド + フロントエンドを同時起動
make dev
```

または個別に起動：

```bash
# ターミナル 1: バックエンド (port 8080)
make dev-backend

# ターミナル 2: フロントエンド (port 3000)
make dev-frontend
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

### ワンライナーセットアップ / Quick Setup

すべてを一度に実行する場合：

```bash
make setup
```

---

## Makefile コマンド一覧 / Available Commands

| コマンド | 説明 |
|---------|------|
| `make setup` | 初回セットアップ（ツール導入 → 依存解決 → DB起動 → マイグレーション） |
| `make dev` | バックエンド + フロントエンドを同時に起動 |
| `make dev-backend` | Go バックエンドサーバーのみ起動 (port 8080) |
| `make dev-frontend` | Next.js フロントエンドのみ起動 (port 3000) |
| `make generate` | buf generate + sqlc generate でコード生成 |
| `make test` | Go の全テストを実行 |
| `make build` | Next.js のプロダクションビルド |
| `make migrate-up` | DB マイグレーションを最新まで適用 |
| `make migrate-down` | 直前のマイグレーションを1つロールバック |
| `make migrate-create NAME=xxx` | 新しいマイグレーションファイルを作成 |
| `make db-start` | PostgreSQL コンテナを起動 |
| `make db-stop` | PostgreSQL コンテナを停止 |
| `make lint` | Proto ファイルの lint チェック |

---

## プロジェクト構成 / Project Structure

```
.
├── proto/security/v1/         # Protocol Buffers 定義
│   └── service.proto          #   Connect RPC サービス定義
├── gen/                       # 生成コード（Go）
│   └── proto/security/v1/     #   Go Proto 生成ファイル
├── backend/
│   ├── cmd/server/main.go     # エントリーポイント / サーバー起動
│   ├── db/
│   │   ├── query/             #   SQL クエリ定義 (sqlc 入力)
│   │   ├── migrations/        #   DB マイグレーション
│   │   ├── *.sql.go           #   sqlc 生成コード
│   │   └── *_test.go          #   DB ユニットテスト
│   └── sqlc.yaml              # sqlc 設定
├── frontend/
│   ├── app/                   # Next.js App Router ページ
│   │   ├── page.tsx           #   ダッシュボード
│   │   ├── controls/          #   Control CRUD
│   │   ├── search/            #   ナレッジ検索
│   │   ├── unmatched/         #   未マッチ質問管理
│   │   ├── feed/              #   変更フィード
│   │   ├── upload/            #   CSV アップロード
│   │   └── api/               #   API Routes (プロキシ)
│   ├── hooks/                 # カスタムフック
│   ├── gen/proto/             # 生成コード（TypeScript）
│   └── lib/                   # ユーティリティ
├── infra/                     # Terraform (GKE デプロイ)
├── docker-compose.yaml        # PostgreSQL コンテナ定義
├── buf.gen.yaml               # buf コード生成設定
├── mise.toml                  # ツールバージョン管理
├── Makefile                   # 開発用コマンド
└── go.work                    # Go ワークスペース
```

---

## ポート情報 / Ports

| サービス | ポート |
|---------|--------|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Go / Connect RPC) | http://localhost:8080 |
| PostgreSQL | localhost:5433 |

---

## 補足 / Notes

### Google Cloud Pub/Sub

バックエンド起動時に Pub/Sub リスナーが起動します。GCP 認証情報がない環境ではエラーログが出ますが、Pub/Sub 以外の機能（CRUD、検索など）は正常に動作します。

ローカルで Pub/Sub を使う場合は、GCP エミュレータの利用を推奨します：

```bash
gcloud beta emulators pubsub start --project=your-project-id
export PUBSUB_EMULATOR_HOST=localhost:8085
```

### 全文検索 (Bleve)

バックエンドは [Bleve](https://blevesearch.com/) による日本語対応の全文検索エンジンを内蔵しています。起動時に既存の Control データを自動的にインデックス化します。インデックスデータは `backend/controls.bleve/` に保存されます。
