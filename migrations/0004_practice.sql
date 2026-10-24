-- Practice time ("Probenzeit"): members who turned it on, their time per day, and their own
-- marks in the parts. Only the member sees their own rows (/profil, the practice viewer);
-- nothing else in the app reads them.
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

-- A member's own pen marks on the pages of a part in the practice viewer, one row per page:
-- the strokes as JSON. Only the member sees them; an empty page has no row.
CREATE TABLE IF NOT EXISTS practice_marks (
	email TEXT NOT NULL,
	file TEXT NOT NULL,
	page INTEGER NOT NULL,
	strokes TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY (email, file, page)
);
