-- The completeness check for parts (#93): how many pages each PDF in the archive has, so the
-- app can hint at empty and incomplete parts. File ids and page counts only, nothing personal.
-- Every statement must be safe to run twice.

-- One row per file, checked again when Drive says it changed. pages is NULL when the file
-- isn't a readable PDF; skipped is 1 for files too big to check within the CPU limit.
-- dismissed is 1 when an organiser said the hint is wrong; a new version asks again.
CREATE TABLE IF NOT EXISTS part_checks (
	file_id TEXT PRIMARY KEY,
	modified TEXT NOT NULL,
	pages INTEGER,
	skipped INTEGER NOT NULL DEFAULT 0,
	dismissed INTEGER NOT NULL DEFAULT 0,
	checked_at TEXT NOT NULL DEFAULT (datetime('now'))
);
