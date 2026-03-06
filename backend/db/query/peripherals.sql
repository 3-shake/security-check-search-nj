-- name: ListPendingUnmatchedTasks :many
SELECT * FROM unmatched_tasks
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
-- name: ListFeedEvents :many
SELECT 
    f.id,
    f.event_type,
    f.control_id,
    f.user_name,
    f.description,
    f.created_at,
    c.title as control_title  
FROM feed_events f
LEFT JOIN controls c ON f.control_id = c.id
ORDER BY f.created_at DESC
LIMIT 50;
-- name: CreateFeedEvent :one
-- 「誰が何を更新したか」をタイムラインに流すためのクエリです
INSERT INTO feed_events (
    event_type, control_id, user_name, description
) VALUES (
    $1, $2, $3, $4
) RETURNING *;
-- name: CreateUnmatchedTask :one
-- CSVから読み取った質問を保存するクエリです
INSERT INTO unmatched_tasks (
    original_file_name, row_number, question_text, status
) VALUES (
    $1, $2, $3, 'pending'
) RETURNING *;

-- name: UpdateUnmatchedTaskStatus :exec
UPDATE unmatched_tasks
SET status = $2
WHERE id = $1;
