CREATE TABLE IF NOT EXISTS processing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    file_type TEXT NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    error_reason TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    key_or_ip TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_logs_file_type ON processing_logs(file_type);
CREATE INDEX IF NOT EXISTS idx_processing_logs_success ON processing_logs(success);
