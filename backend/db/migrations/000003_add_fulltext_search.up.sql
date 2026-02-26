-- PostgreSQLの「トリグラム（N-gram）検索拡張機能」を有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- title, question, answer を結合したテキストに対して、高速検索用のGINインデックスを作成
CREATE INDEX idx_controls_fulltext ON controls USING GIN ((title || ' ' || question || ' ' || answer) gin_trgm_ops);
