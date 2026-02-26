-- カテゴリは正規化せず、タグのみ正規化する設計

-- 1. tags テーブル (タグマスタ)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. controls テーブル (ナレッジ本体)
CREATE TABLE controls (
    id VARCHAR(255) PRIMARY KEY, 
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL, -- カテゴリは文字列
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. control_tags テーブル (ControlとTagの多対多・交差テーブル)
CREATE TABLE control_tags (
    control_id VARCHAR(255) REFERENCES controls(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (control_id, tag_id)
);

-- タグ検索を高速化するインデックス
CREATE INDEX idx_control_tags_tag_id ON control_tags(tag_id);

-- 4. control_versions テーブル (変更履歴・スナップショット)
CREATE TABLE control_versions (
    id SERIAL PRIMARY KEY,
    control_id VARCHAR(255) REFERENCES controls(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL, 
    tags JSONB, -- 当時のタグ配列をJSONBで保存
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (control_id, version)
);