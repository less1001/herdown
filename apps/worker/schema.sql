-- D1 Database Schemas for MD for Agents
-- PRD Section 3 Compliance

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free', -- free | pro | team
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT DEFAULT 'default',
    status TEXT DEFAULT 'active', -- active | revoked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_or_ip TEXT NOT NULL,
    parse_date TEXT NOT NULL, -- YYYY-MM-DD
    count INTEGER DEFAULT 1,
    UNIQUE(key_or_ip, parse_date)
);

-- Insert default admin / demo user & initial key if not present
INSERT OR IGNORE INTO users (id, email, plan) VALUES ('usr_default', 'user@mdforagents.com', 'pro');
INSERT OR IGNORE INTO api_keys (key, user_id, name, status) VALUES ('sk_live_REDACTED', 'usr_default', 'Default Key', 'active');
