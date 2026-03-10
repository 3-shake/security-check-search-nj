# ============================================================
# Security Check Search NJ — Makefile
# ============================================================

# 環境変数をロード (.env が存在する場合)
-include .env
export

DATABASE_URL ?= postgres://postgres:password@localhost:5433/security_check?sslmode=disable
MIGRATION_DIR := backend/db/migrations

.PHONY: help setup dev dev-backend dev-frontend generate test build \
        migrate-up migrate-down migrate-create db-start db-stop lint clean

# デフォルトターゲット: ヘルプを表示
help: ## コマンド一覧を表示 / Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================================
# セットアップ / Setup
# ============================================================

setup: ## 初回セットアップ（ツール導入→依存解決→DB起動→マイグレーション）
	mise install
	cd frontend && pnpm install
	docker compose up -d
	@echo "⏳ PostgreSQL の起動を待機中..."
	@sleep 3
	$(MAKE) migrate-up
	@echo "✅ セットアップ完了！ 'make dev' で開発サーバーを起動してください。"

# ============================================================
# 開発サーバー / Dev Servers
# ============================================================

dev: ## バックエンド + フロントエンドを同時に起動 / Start both servers
	@echo "🚀 Starting backend (8080) and frontend (3000)..."
	@trap 'kill 0' EXIT; \
		$(MAKE) dev-backend & \
		$(MAKE) dev-frontend & \
		wait

dev-backend: ## Go バックエンドサーバーを起動 (port 8080)
	cd backend && go run ./cmd/server/main.go

dev-frontend: ## Next.js フロントエンドを起動 (port 3000)
	cd frontend && pnpm dev

# ============================================================
# コード生成 / Code Generation
# ============================================================

generate: ## buf generate + sqlc generate でコードを生成 / Generate code from proto & SQL
	buf generate
	cd backend && sqlc generate
	@echo "✅ コード生成完了"

lint: ## Proto ファイルの lint チェック / Lint proto files
	buf lint

# ============================================================
# テスト・ビルド / Test & Build
# ============================================================

test: ## Go の全テストを実行 / Run all Go tests
	cd backend && go test ./... -v

build: ## Next.js のプロダクションビルド / Build frontend for production
	cd frontend && pnpm build

# ============================================================
# データベース / Database
# ============================================================

db-start: ## PostgreSQL コンテナを起動 / Start PostgreSQL container
	docker compose up -d

db-stop: ## PostgreSQL コンテナを停止 / Stop PostgreSQL container
	docker compose down

migrate-up: ## DB マイグレーションを最新まで適用 / Apply all migrations
	migrate -database "$(DATABASE_URL)" -path $(MIGRATION_DIR) up

migrate-down: ## 直前のマイグレーションを1つロールバック / Rollback last migration
	migrate -database "$(DATABASE_URL)" -path $(MIGRATION_DIR) down 1

migrate-create: ## 新しいマイグレーション作成 (NAME=xxx) / Create new migration
	@if [ -z "$(NAME)" ]; then echo "❌ Usage: make migrate-create NAME=add_xxx_table"; exit 1; fi
	migrate create -ext sql -dir $(MIGRATION_DIR) -seq $(NAME)

# ============================================================
# クリーンアップ / Cleanup
# ============================================================

clean: ## ビルド成果物を削除 / Remove build artifacts
	rm -rf frontend/.next
	rm -rf backend/controls.bleve
	@echo "✅ クリーンアップ完了"
