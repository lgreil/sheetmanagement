-- Everything people maintain (#186): pieces, concerts, programmes, members, rights, sign-ups,
-- loans, notes, settings … one row per row of the sheet's tabs, by tab, with the cells by
-- column key (not by the column's name, which depends on the language). After the import on
-- /setup/datenbank this is the source of truth and the sheet is a nightly copy.
-- Every statement must be safe to run twice.

-- The tabs that exist: a feature whose tab is missing is off or not set up, as with the sheet.
CREATE TABLE IF NOT EXISTS data_tabs (
	tab TEXT PRIMARY KEY,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rows in the order they were added; ids stay, so a save never lands on the wrong row.
-- cells is a JSON object, column key → text; empty cells are left out.
CREATE TABLE IF NOT EXISTS data_rows (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tab TEXT NOT NULL,
	cells TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS data_rows_tab ON data_rows (tab, id);
