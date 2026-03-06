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
    COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}')::varchar[] AS tags
FROM controls c
LEFT JOIN control_tags ct ON c.id = ct.control_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE 
    -- 結合したテキストに対して検索をかけることで、GINインデックスを有効化する
    (c.title || ' ' || c.question || ' ' || c.answer) ILIKE '%' || $1 || '%'
GROUP BY c.id;
