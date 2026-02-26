-- name: SearchControls :many
-- 指定されたキーワード（$1）が、タイトル・質問・回答のどこかに含まれる Control を検索します
-- db/query/search.sql

-- name: SearchControls :many
SELECT 
    c.id, 
    c.title, 
    c.category, 
    c.question, 
    c.answer, 
    c.status, 
    c.version, 
    c.created_at, 
    c.updated_at,
    -- ここで tags を配列として取得し、名前を tags にする
    COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}')::varchar[] AS tags
FROM controls c
LEFT JOIN control_tags ct ON c.id = ct.control_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE 
    (c.title ILIKE '%' || $1 || '%' OR 
     c.question ILIKE '%' || $1 || '%' OR 
     c.answer ILIKE '%' || $1 || '%')
GROUP BY c.id;
