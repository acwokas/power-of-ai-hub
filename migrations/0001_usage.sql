CREATE TABLE IF NOT EXISTS usage_reservations (id TEXT PRIMARY KEY, ts INTEGER NOT NULL, fingerprint TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS usage_time ON usage_reservations(ts);
CREATE INDEX IF NOT EXISTS usage_client_time ON usage_reservations(fingerprint,ts);
