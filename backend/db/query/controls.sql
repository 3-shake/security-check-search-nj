-- backend/db/query/controls.sql

-- name: GetControl :one
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
WHERE c.id = $1
GROUP BY c.id;

-- name: ListControls :many
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
GROUP BY c.id
ORDER BY c.updated_at DESC;

-- name: ListControlsPaginated :many
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
GROUP BY c.id
ORDER BY c.updated_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateControl :one
INSERT INTO controls (
  id, title, question, answer, category, status, version
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: UpdateControl :one
UPDATE controls
SET 
    title = $2,
    category = $3,
    question = $4,
    answer = $5,
    status = $6,
    version = $7,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteControl :exec
DELETE FROM controls
WHERE id = $1;

-- name: UpsertTag :one
INSERT INTO tags (name) 
VALUES ($1) 
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
RETURNING id;

-- name: LinkControlTag :exec
INSERT INTO control_tags (control_id, tag_id) 
VALUES ($1, $2) 
ON CONFLICT DO NOTHING;

-- name: DeleteControlTags :exec
-- 更新時に一度古いタグの紐付けを全てリセットするためのクエリです
DELETE FROM control_tags 
WHERE control_id = $1;

-- name: CreateControlVersion :one
-- 変更前のスナップショットを履歴として保存するためのクエリです
INSERT INTO control_versions (
    control_id, version, title, category, tags, question, answer, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;
-- name: GetControlsByIDs :many
SELECT 
    c.id, c.title, c.category, c.question, c.answer, c.status, c.version,
    COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}')::varchar[] AS tags
FROM controls c
LEFT JOIN control_tags ct ON c.id = ct.control_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE c.id = ANY($1::text[])
GROUP BY c.id;

-- name: CountControls :one
SELECT COUNT(*) FROM controls;

-- name: CountPendingUnmatchedTasks :one
SELECT COUNT(*) FROM unmatched_tasks WHERE status = 'pending';
-- name: CountRecentTeamUpdates :one
SELECT COUNT(*) FROM feed_events 
WHERE created_at >= NOW() - INTERVAL '7 days';