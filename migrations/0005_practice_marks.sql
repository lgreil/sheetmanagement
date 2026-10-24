-- A member's own notes in their parts, drawn in the practice viewer (/ueben). Only the member
-- sees them; nothing else in the app reads them.
-- Every statement must be safe to run twice.

-- One row per member, part and page: the strokes as JSON. An empty page has no row.
CREATE TABLE IF NOT EXISTS practice_marks (
	email TEXT NOT NULL,
	file TEXT NOT NULL,
	page INTEGER NOT NULL,
	strokes TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY (email, file, page)
);
