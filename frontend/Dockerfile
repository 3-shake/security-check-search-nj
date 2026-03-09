# ==========================================
# 1. ベースステージ
# ==========================================
FROM node:20-alpine AS base
RUN corepack enable pnpm

# ==========================================
# 2. ビルド用ステージ
# ==========================================
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ==========================================
# 3. 実行用ステージ（本番用・極小サイズ）
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# スタンドアロンモードで必要な環境変数
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# セキュリティ強化のため、非特権ユーザーを作成して実行
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# ① スタンドアロンモードで生成された「最小限の実行ファイル群」をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# ② 画面表示に必要な静的ファイル（CSSやJS）をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ③ （※もし今後 public フォルダを作った場合は、以下のコメントアウトを外してください）
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public 

EXPOSE 3000

# ★ スタンドアロンモードでは「pnpm start」ではなく、生成された server.js を直接実行します
CMD ["node", "server.js"]