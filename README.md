# Security Check Search NJ

## 必須要件 (Prerequisites)

ローカル環境で開発・実行するには、以下のツールが必要です。

| ツール | バージョン |
|--------|-----------|
| Go | v1.21+ |
| Node.js & pnpm | v20+ |
| PostgreSQL | v15+ |
| buf CLI | Protobufコンパイル用 |
| sqlc | Go DBコード自動生成用 |

---

## 環境構築手順 (Getting Started)

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd security-check-search-nj
```

---

### 2. データベースのセットアップ (PostgreSQL)

ローカルの PostgreSQL を起動し、専用のデータベースを作成します。

```sql
-- PostgreSQL にログイン
psql -U postgres

-- データベースの作成
CREATE DATABASE security_system;
\c security_system

-- N-gram 検索用の拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

### 3. バックエンド (Go) の起動

バックエンドサーバーはポート **8080** で起動します。

```bash
cd backend

# 依存パッケージのダウンロード
go mod tidy

# サーバーの起動
go run ./cmd/server/main.go
```

> **Note:** 現在、起動時に Google Cloud Pub/Sub のリスナーが走ります。エラーが出る場合は適宜 GCP の認証情報（`GOOGLE_APPLICATION_CREDENTIALS`）を設定するか、GCP エミュレータをご利用ください。

---

### 4. フロントエンド (Next.js) の起動

```bash
cd frontend

# 依存パッケージのインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスすると UI が表示されます。

