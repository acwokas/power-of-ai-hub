CREATE TABLE IF NOT EXISTS daily_outcomes (
 day INTEGER NOT NULL,
 tool TEXT NOT NULL,
 status INTEGER NOT NULL,
 requests INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(day, tool, status)
);
