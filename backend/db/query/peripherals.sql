-- name: ListPendingUnmatchedTasks :many
SELECT * FROM unmatched_tasks
WHERE status = 'pending'
ORDER BY created_at ASC;

-- name: ListFeedEvents :many
SELECT * FROM feed_events
ORDER BY created_at DESC
LIMIT 50;
-- name: CreateFeedEvent :one
-- 「誰が何を更新したか」をタイムラインに流すためのクエリです
INSERT INTO feed_events (
    event_type, control_id, user_name, description
) VALUES (
    $1, $2, $3, $4
) RETURNING *;