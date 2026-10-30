-- The error log (#191): errors on the server and in members' browsers, grouped by kind, so
-- admins see them on /status and hear about a new kind within an hour. Where it happened
-- (the route, not the address) and the message with addresses, ids and numbers taken out;
-- nothing that says who it happened to. Every statement must be safe to run twice.

-- One row per kind: the same message at the same place counts up instead of adding a row.
-- notified is 1 once the admins were told about this kind.
CREATE TABLE IF NOT EXISTS error_log (
	fingerprint TEXT PRIMARY KEY,
	source TEXT NOT NULL,
	place TEXT NOT NULL,
	message TEXT NOT NULL,
	status INTEGER,
	count INTEGER NOT NULL DEFAULT 1,
	first_at TEXT NOT NULL DEFAULT (datetime('now')),
	last_at TEXT NOT NULL DEFAULT (datetime('now')),
	notified INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS error_log_last ON error_log (last_at);
