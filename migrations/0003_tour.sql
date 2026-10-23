-- The tour for new members: who finished or skipped it, so it isn't offered on every visit.
-- Every statement must be safe to run twice.

-- One row per member; "done" or "skipped". Retaking it from /profil writes the row again.
CREATE TABLE IF NOT EXISTS tour_seen (
	email TEXT PRIMARY KEY,
	outcome TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
