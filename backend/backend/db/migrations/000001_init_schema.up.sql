-- backend/db/migrations/000001_init_schema.up.sql

CREATE TYPE control_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE controls (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags VARCHAR(100)[] DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status control_status DEFAULT 'draft'
);

CREATE TABLE control_versions (
    control_id VARCHAR(50) NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    diff JSONB NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (control_id, version)
);

CREATE INDEX idx_controls_category ON controls(category);
CREATE INDEX idx_control_versions_control_id ON control_versions(control_id);