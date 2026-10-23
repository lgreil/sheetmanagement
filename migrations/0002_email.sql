-- Email (#123): who turned email reminders off, and how often sign-in links were asked for.
-- Every statement must be safe to run twice.

-- Members who don't want reminders by email, one row each; set on /profil.
CREATE TABLE IF NOT EXISTS email_opt_out (
	email TEXT PRIMARY KEY,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Counters for rate limits, e.g. sign-in links per email and per address. A row's window
-- starts again once it is older than the limit's window.
CREATE TABLE IF NOT EXISTS rate_limits (
	key TEXT PRIMARY KEY,
	count INTEGER NOT NULL,
	window_start TEXT NOT NULL DEFAULT (datetime('now'))
);
