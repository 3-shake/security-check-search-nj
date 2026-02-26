-- name: ListPendingUnmatchedTasks :many
SELECT * FROM unmatched_tasks
WHERE status = 'pending'
ORDER BY created_at ASC;

-- name: ListFeedEvents :many
SELECT * FROM feed_events
ORDER BY created_at DESC
LIMIT 50;
