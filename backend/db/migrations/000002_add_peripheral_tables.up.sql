
-- 未マッチタスクのステータス
CREATE TYPE unmatched_status AS ENUM ('pending', 'resolved', 'ignored');

-- 未マッチタスク管理テーブル
CREATE TABLE unmatched_tasks (
    id SERIAL PRIMARY KEY,
    original_file_name VARCHAR(255) NOT NULL,
    row_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    status unmatched_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- イベント種別
CREATE TYPE feed_event_type AS ENUM ('created', 'updated', 'mapped');

-- フィード（活動履歴）テーブル
CREATE TABLE feed_events (
    id SERIAL PRIMARY KEY,
    event_type feed_event_type NOT NULL,
    control_id VARCHAR(50) REFERENCES controls(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_unmatched_tasks_status ON unmatched_tasks(status);
CREATE INDEX idx_feed_events_created_at ON feed_events(created_at DESC);
