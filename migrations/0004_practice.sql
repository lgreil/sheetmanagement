-- Practice time ("Probenzeit"): members who turned it on, and their time per day. Only the
-- member sees their own rows (/profil); nothing else in the app reads them.
-- Every statement must be safe to run twice.

-- One row per member who turned it on on /profil; turning it off deletes the row.
CREATE TABLE IF NOT EXISTS practice_opt_in (
	email TEXT PRIMARY KEY,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seconds a part of the member's own instrument was open in the practice viewer, per day
-- ("2026-10-24", in the orchestra's time zone).
CREATE TABLE IF NOT EXISTS practice_days (
	email TEXT NOT NULL,
	day TEXT NOT NULL,
	seconds INTEGER NOT NULL,
	PRIMARY KEY (email, day)
);
