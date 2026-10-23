-- What the app writes itself and nobody edits by hand (#161). Applied by the deploy
-- workflow (wrangler d1 migrations apply), by /setup, and by the app on first use.
-- Every statement must be safe to run twice.

-- Devices that allowed notifications (#157), one row each. Deleted on sign-out, when
-- notifications are turned off, or when the push service says the device is gone.
CREATE TABLE IF NOT EXISTS push_subscriptions (
	endpoint TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	p256dh TEXT NOT NULL,
	auth TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS push_subscriptions_email ON push_subscriptions (email);

-- Reminders that went out (#157, #144, #159), so nobody gets one twice. Kept for a year.
CREATE TABLE IF NOT EXISTS reminders_sent (
	kind TEXT NOT NULL,
	subject TEXT NOT NULL,
	recipient TEXT NOT NULL,
	sent_at TEXT NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY (kind, subject, recipient)
);

-- Small values a job keeps between runs, e.g. the last connection check (#159).
CREATE TABLE IF NOT EXISTS job_state (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
