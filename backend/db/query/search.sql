-- name: SearchControls :many
-- 指定されたキーワード（$1）が、タイトル・質問・回答のどこかに含まれる Control を検索します
SELECT * FROM controls
WHERE (title || ' ' || question || ' ' || answer) ILIKE '%' || $1 || '%'
ORDER BY updated_at DESC;
