-- Concert tickets (docs/tickets-plan.md): reserved on the website, paid at the Kasse, checked
-- at the door. Buyers aren't members: name and e-mail per order, deleted some weeks after the
-- concert. Every statement must be safe to run twice.

-- One row per concert that sells tickets. concert_id is the Calendar event id the feed uses.
-- prices is JSON: [{ "type": "adult", "label": "Erwachsene", "cents": 1200 }]. Free seating
-- only for now: capacity says how many may come, counted with the tickets sold elsewhere.
-- Tickets bought online cost more, to cover the fees: fee_percent of the price (rounded up to
-- the cent) plus fee_cents per ticket. Free tickets stay free.
CREATE TABLE IF NOT EXISTS ticket_sales (
	concert_id TEXT PRIMARY KEY,
	seating TEXT NOT NULL DEFAULT 'free',
	capacity INTEGER NOT NULL,
	plan TEXT,
	prices TEXT NOT NULL,
	fee_percent REAL NOT NULL DEFAULT 0,
	fee_cents INTEGER NOT NULL DEFAULT 0,
	online_until TEXT NOT NULL,
	open INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- id is random and long: the link to the tickets in the confirmation mail holds it.
CREATE TABLE IF NOT EXISTS ticket_orders (
	id TEXT PRIMARY KEY,
	concert_id TEXT NOT NULL,
	name TEXT NOT NULL,
	email TEXT,
	channel TEXT NOT NULL,
	status TEXT NOT NULL,
	held_until TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS ticket_orders_concert ON ticket_orders (concert_id);

-- code: 128 random bits in base32, all the QR code holds. seat is empty for free seating.
-- cents is what the ticket costs, fee_cents the part of it that is the online surcharge.
CREATE TABLE IF NOT EXISTS tickets (
	code TEXT PRIMARY KEY,
	order_id TEXT NOT NULL,
	concert_id TEXT NOT NULL,
	seat TEXT,
	type TEXT NOT NULL,
	cents INTEGER NOT NULL,
	fee_cents INTEGER NOT NULL DEFAULT 0,
	checked_in_at TEXT,
	checked_in_by TEXT
);

CREATE INDEX IF NOT EXISTS tickets_concert ON tickets (concert_id);
CREATE INDEX IF NOT EXISTS tickets_order ON tickets (order_id);

-- A seat can only be sold once, even when two people click it at the same moment.
CREATE UNIQUE INDEX IF NOT EXISTS tickets_seat ON tickets (concert_id, seat) WHERE seat IS NOT NULL;
