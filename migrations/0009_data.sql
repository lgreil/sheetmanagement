-- Everything people maintain (#186): pieces, concerts, programmes, members, rights, sign-ups,
-- loans, notes, settings. One table per tab of the sheet, a column per column, with the links
-- and checks the sheet only had as conventions (see src/lib/server/db/schema.ts, which this is
-- written from; a test keeps the two equal). After the import on /setup/datenbank this is the
-- source of truth and the sheet is a nightly copy.
-- Every statement must be safe to run twice.

-- The tabs that exist: a feature whose tab is missing is off or not set up, as with the sheet.
CREATE TABLE IF NOT EXISTS data_tabs (
	tab TEXT PRIMARY KEY,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stays empty: a save inserts changes() here after each guarded statement, and the CHECK
-- fails the whole batch when a row it read had changed meanwhile (rev no longer matched).
CREATE TABLE IF NOT EXISTS write_guard (
	changed INTEGER CHECK (changed > 0)
);

-- Text columns hold the sheet's values as text. A link has an _id column and keeps the
-- name in its text column only when it matches nothing; _key columns hold a value as the
-- app compares it (without case and accents), for uniqueness.

CREATE TABLE IF NOT EXISTS "pieces" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"title" TEXT,
	"title_key" TEXT,
	"composer" TEXT,
	"composer_full" TEXT,
	"catalogue" TEXT,
	"arranger" TEXT,
	"genre" TEXT,
	"difficulty" TEXT,
	"notes" TEXT,
	"reviewed_at" TEXT,
	"recording" TEXT,
	"duration" TEXT,
	"publisher" TEXT,
	"drive_folder_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("title_key"),
	UNIQUE ("drive_folder_id"),
	CHECK ("title" IS NOT NULL OR "drive_folder_id" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "concerts" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"date" TEXT,
	"title" TEXT,
	"title_key" TEXT,
	"location" TEXT,
	"orchestra" TEXT,
	"same_program_as_id" INTEGER REFERENCES "concerts" ("id") ON DELETE SET NULL,
	"same_program_as" TEXT,
	"event_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("title_key"),
	UNIQUE ("event_id"),
	CHECK ("title" IS NOT NULL OR "event_id" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "program_items" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"concert_id" INTEGER NOT NULL REFERENCES "concerts" ("id") ON DELETE CASCADE,
	"concert" TEXT,
	"position" TEXT,
	"piece_id" INTEGER REFERENCES "pieces" ("id") ON DELETE RESTRICT,
	"piece" TEXT,
	"notes" TEXT,
	"orchestra" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "members" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"email" TEXT,
	"email_key" TEXT,
	"name" TEXT,
	"instrument" TEXT,
	"groups" TEXT,
	"orchestras" TEXT,
	"status" TEXT,
	"paused_until" TEXT,
	"link_version" TEXT,
	"feed_version" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("email_key"),
	CHECK ("email" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "access_groups" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"name" TEXT,
	"name_key" TEXT,
	"description" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("name_key"),
	CHECK ("name" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "access_rights" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"who" TEXT,
	"who_key" TEXT,
	"right" TEXT,
	"right_key" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("who_key", "right_key"),
	CHECK ("who" IS NOT NULL),
	CHECK ("right" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "access_requests" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"email" TEXT,
	"email_key" TEXT,
	"name" TEXT,
	"requested_at" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("email_key"),
	CHECK ("email" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "reports" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"piece" TEXT,
	"piece_id_id" INTEGER REFERENCES "pieces" ("id") ON DELETE RESTRICT,
	"piece_id" TEXT,
	"part" TEXT,
	"file_id" TEXT,
	"kind" TEXT,
	"comment" TEXT,
	"status" TEXT,
	"note" TEXT,
	"reported_by" TEXT,
	"reported_at" TEXT,
	"marked" TEXT,
	"drive_comment" TEXT,
	"link" TEXT,
	"sheet_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("sheet_id")
);

CREATE TABLE IF NOT EXISTS "wishes" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"kind" TEXT,
	"title" TEXT,
	"composer" TEXT,
	"link" TEXT,
	"description" TEXT,
	"status" TEXT,
	"answer" TEXT,
	"submitted_by" TEXT,
	"submitted_at" TEXT,
	"votes" TEXT,
	"concert" TEXT,
	"piece_id" TEXT,
	"sheet_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("sheet_id")
);

CREATE TABLE IF NOT EXISTS "missing_parts" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"piece" TEXT,
	"part" TEXT,
	"status" TEXT,
	"file_id" TEXT,
	"done" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("file_id"),
	CHECK ("file_id" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "instrument_groups" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"part" TEXT,
	"players" TEXT,
	"mutual" TEXT,
	"note" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "signups" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"event" TEXT,
	"who" TEXT,
	"name" TEXT,
	"answer" TEXT,
	"instrument" TEXT,
	"comment" TEXT,
	"answered_at" TEXT,
	"event_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "rehearsals" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"rehearsal" TEXT,
	"piece_id" INTEGER REFERENCES "pieces" ("id") ON DELETE RESTRICT,
	"piece" TEXT,
	"notes" TEXT,
	"event_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "loans" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"piece_id" INTEGER REFERENCES "pieces" ("id") ON DELETE RESTRICT,
	"piece" TEXT,
	"from" TEXT,
	"borrowed_at" TEXT,
	"due_at" TEXT,
	"returned" TEXT,
	"notes" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "attendance" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"event" TEXT,
	"who" TEXT,
	"name" TEXT,
	"present" TEXT,
	"event_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "piece_notes" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"piece_id" INTEGER REFERENCES "pieces" ("id") ON DELETE RESTRICT,
	"piece" TEXT,
	"section" TEXT,
	"concert_id" INTEGER REFERENCES "concerts" ("id") ON DELETE RESTRICT,
	"concert" TEXT,
	"note" TEXT,
	"by" TEXT,
	"at" TEXT,
	"sheet_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("sheet_id")
);

CREATE TABLE IF NOT EXISTS "rehearsal_notes" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"rehearsal" TEXT,
	"done" TEXT,
	"practise" TEXT,
	"next" TEXT,
	"by" TEXT,
	"at" TEXT,
	"event_id" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "instruments" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"name" TEXT,
	"name_key" TEXT,
	"label" TEXT,
	"aliases" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("name_key"),
	CHECK ("name" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "settings" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"rev" INTEGER NOT NULL DEFAULT 0,
	"key" TEXT,
	"key_key" TEXT,
	"value" TEXT,
	"updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE ("key_key"),
	CHECK ("key" IS NOT NULL)
);
