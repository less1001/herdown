-- One-time credit packs. This migration is additive and leaves existing users and API keys untouched.
CREATE TABLE IF NOT EXISTS payment_orders (
  merchant_order_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  product_code TEXT NOT NULL,
  credits INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  mode TEXT NOT NULL DEFAULT 'prod',
  waffo_order_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_api_key ON payment_orders(api_key);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key TEXT NOT NULL,
  credits INTEGER NOT NULL,
  reason TEXT NOT NULL,
  external_order_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_api_key ON credit_ledger(api_key);
