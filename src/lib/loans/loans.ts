import { parseDay } from '#lib/access/access.ts';
import { isDone } from '#lib/repertoire/missing-parts.ts';
import { LAYOUT, normalize, readTable, type ColumnKey, type Table } from '#lib/repertoire/sheet.ts';

/**
 * Rented and borrowed sheet music ("Leihmaterial", #119): from a publisher or another
 * orchestra, with a return date. One row per loan; "Zurückgegeben" is a checkbox. The
 * tab is optional; without it the pages just show no loans.
 */

export type LoanTable = Table<ColumnKey<'loans'> & string>;

export interface Loan {
	row: number;
	/** The name as entered, matched against "Stücke" by the pages. */
	pieceName: string;
	/** Publisher or orchestra. */
	from: string;
	/** "2026-09-01", if readable. */
	borrowedAt?: string;
	/** "2026-12-15", if readable. */
	dueAt?: string;
	/** The date as entered, shown when it can't be read. */
	dueText: string;
	returned: boolean;
	notes?: string;
}

export interface Loans {
	loans: Loan[];
	table: LoanTable;
}

export function buildLoans(values: string[][]): Loans {
	const table = readTable(values, LAYOUT.loans.columns);
	const loans = table.rows
		.filter(({ values: v }) => v.piece)
		.map(({ row, values: v }) => ({
			row,
			pieceName: v.piece,
			from: v.from,
			borrowedAt: parseDay(v.borrowedAt),
			dueAt: parseDay(v.dueAt),
			dueText: v.dueAt,
			returned: isDone(v.returned),
			notes: v.notes || undefined
		}));
	return { loans, table };
}

/** Open loans are due "soon" this many days ahead; that's when they show up as a to-do. */
export const DUE_SOON_DAYS = 14;

export type LoanState = 'returned' | 'overdue' | 'due-soon' | 'open';

const addDays = (day: string, days: number) => new Date(Date.parse(`${day}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function loanState(loan: Pick<Loan, 'returned' | 'dueAt'>, today: string): LoanState {
	if (loan.returned) return 'returned';
	if (!loan.dueAt) return 'open';
	if (loan.dueAt < today) return 'overdue';
	return loan.dueAt <= addDays(today, DUE_SOON_DAYS) ? 'due-soon' : 'open';
}

/** Days until the loan is due (negative: overdue); undefined without a readable date. */
export function daysUntilDue(loan: Pick<Loan, 'dueAt'>, today: string): number | undefined {
	if (!loan.dueAt) return undefined;
	return Math.round((Date.parse(loan.dueAt) - Date.parse(today)) / 86_400_000);
}

/** Open loans first, the most urgent on top; returned ones after, latest return date first. */
export function sortLoans<L extends Pick<Loan, 'returned' | 'dueAt' | 'pieceName'>>(loans: L[]): L[] {
	return [...loans].sort((a, b) => {
		if (a.returned !== b.returned) return a.returned ? 1 : -1;
		const due = (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999');
		return (a.returned ? -due : due) || a.pieceName.localeCompare(b.pieceName);
	});
}

/** Open loans that need a look: overdue or due soon. */
export function urgentLoans<L extends Pick<Loan, 'returned' | 'dueAt'>>(loans: L[], today: string): L[] {
	return loans.filter((loan) => ['overdue', 'due-soon'].includes(loanState(loan, today)));
}

/** A piece's open loans, matched by its title in "Stücke". */
export function loansOf<L extends Pick<Loan, 'pieceName' | 'returned'>>(loans: L[], title: string): L[] {
	return loans.filter((loan) => !loan.returned && normalize(loan.pieceName) === normalize(title));
}

export interface NewLoan {
	piece: string;
	from: string;
	borrowedAt: string;
	dueAt: string;
	notes: string;
}

export type LoanProblem = 'piece-missing' | 'from-missing' | 'bad-date';

/** Checks the form; dates are written as "2026-12-15" whatever was typed. */
export function checkLoan(input: NewLoan): { values: NewLoan } | { problem: LoanProblem } {
	const values = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim()])) as unknown as NewLoan;
	if (!values.piece) return { problem: 'piece-missing' };
	if (!values.from) return { problem: 'from-missing' };
	for (const key of ['borrowedAt', 'dueAt'] as const) {
		if (!values[key]) continue;
		const day = parseDay(values[key]);
		if (!day) return { problem: 'bad-date' };
		values[key] = day;
	}
	return { values };
}
