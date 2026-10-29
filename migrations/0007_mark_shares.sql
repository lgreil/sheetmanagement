-- A member's notes in a part, offered to the others who play it: they take them over, all or
-- some, or decline. Only the section sees an offer, and only when its member made one.
-- Every statement must be safe to run twice.

-- One offer per member and part, a copy of their pages then (JSON, by page); offering again
-- replaces it.
CREATE TABLE IF NOT EXISTS mark_shares (
	id TEXT PRIMARY KEY,
	sender TEXT NOT NULL,
	file TEXT NOT NULL,
	pages TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE (sender, file)
);
CREATE INDEX IF NOT EXISTS mark_shares_file ON mark_shares (file);

-- Who answered an offer, so it isn't offered to them again: all, some or declined.
CREATE TABLE IF NOT EXISTS mark_share_answers (
	share TEXT NOT NULL,
	email TEXT NOT NULL,
	answer TEXT NOT NULL,
	answered_at TEXT NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY (share, email)
);
