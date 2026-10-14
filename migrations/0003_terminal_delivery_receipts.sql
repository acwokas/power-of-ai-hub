-- Random, short-lived request receipts only. No user input or output.
CREATE TABLE terminal_receipts (
 id TEXT PRIMARY KEY, tool TEXT NOT NULL, release TEXT NOT NULL,
 token_digest TEXT NOT NULL, created_minute INTEGER NOT NULL,
 expires_at INTEGER NOT NULL, acknowledged_minute INTEGER, disposition TEXT NOT NULL DEFAULT 'pending'
 CHECK(disposition IN ('pending','complete','incomplete','error','cancelled'))
);
CREATE INDEX terminal_receipts_expiry ON terminal_receipts(expires_at);
CREATE TABLE daily_delivery_receipts (
 day INTEGER NOT NULL, tool TEXT NOT NULL, release TEXT NOT NULL,
 delivered_count INTEGER NOT NULL, PRIMARY KEY(day,tool,release)
);
CREATE TRIGGER record_client_ack AFTER UPDATE OF acknowledged_minute ON terminal_receipts
 WHEN OLD.acknowledged_minute IS NULL AND NEW.acknowledged_minute IS NOT NULL
 AND OLD.disposition='complete'
 BEGIN
 INSERT INTO daily_delivery_receipts(day,tool,release,delivered_count)
 VALUES(NEW.acknowledged_minute-NEW.acknowledged_minute%86400,NEW.tool,NEW.release,1)
 ON CONFLICT(day,tool,release) DO UPDATE SET delivered_count=delivered_count+1;
 END;
