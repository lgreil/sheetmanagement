import { describe, expect, it } from 'vitest';
import { buildLoans, checkLoan, daysUntilDue, loansOf, loanState, sortLoans, urgentLoans } from './loans.ts';

const values = [
	['Stück', 'Von', 'Ausgeliehen am', 'Zurück bis', 'Zurückgegeben', 'Notiz'],
	['Bolero', 'Verlag Muster', '2026-09-01', '2026-10-25', 'FALSE', 'Leihgebühr 80 €'],
	['Carmen', 'Stadtorchester', '1.9.2026', '30.11.2026', '', ''],
	['Egmont', 'Verlag Muster', '', '2026-10-01', 'TRUE', ''],
	['Moldau', 'Kreismusikschule', '', 'nach dem Konzert', '', ''],
	['', 'leer', '', '', '', '']
];
const today = '2026-10-21';

describe('buildLoans', () => {
	it('reads every row with a piece, dates in either format', () => {
		const { loans } = buildLoans(values);
		expect(loans.map((loan) => loan.pieceName)).toEqual(['Bolero', 'Carmen', 'Egmont', 'Moldau']);
		expect(loans[1]).toMatchObject({ borrowedAt: '2026-09-01', dueAt: '2026-11-30', returned: false });
		expect(loans[2].returned).toBe(true);
		expect(loans[3]).toMatchObject({ dueAt: undefined, dueText: 'nach dem Konzert' });
	});
});

describe('loanState', () => {
	it('tells overdue, due soon, open and returned apart', () => {
		expect(loanState({ returned: false, dueAt: '2026-10-20' }, today)).toBe('overdue');
		expect(loanState({ returned: false, dueAt: '2026-10-21' }, today)).toBe('due-soon');
		expect(loanState({ returned: false, dueAt: '2026-11-04' }, today)).toBe('due-soon');
		expect(loanState({ returned: false, dueAt: '2026-11-05' }, today)).toBe('open');
		expect(loanState({ returned: false }, today)).toBe('open');
		expect(loanState({ returned: true, dueAt: '2026-01-01' }, today)).toBe('returned');
	});

	it('counts the days', () => {
		expect(daysUntilDue({ dueAt: '2026-10-25' }, today)).toBe(4);
		expect(daysUntilDue({ dueAt: '2026-10-19' }, today)).toBe(-2);
	});
});

describe('lists', () => {
	const { loans } = buildLoans(values);

	it('puts the most urgent first and returned ones last', () => {
		expect(sortLoans(loans).map((loan) => loan.pieceName)).toEqual(['Bolero', 'Carmen', 'Moldau', 'Egmont']);
	});

	it('finds the urgent ones and a piece’s open loans', () => {
		expect(urgentLoans(loans, today).map((loan) => loan.pieceName)).toEqual(['Bolero']);
		expect(loansOf(loans, 'BOLERO')).toHaveLength(1);
		expect(loansOf(loans, 'Egmont')).toHaveLength(0);
	});
});

describe('checkLoan', () => {
	const input = { piece: ' Bolero ', from: 'Verlag', borrowedAt: '1.9.2026', dueAt: '', notes: '' };

	it('cleans up and writes dates the sheet’s way', () => {
		expect(checkLoan(input)).toEqual({ values: { piece: 'Bolero', from: 'Verlag', borrowedAt: '2026-09-01', dueAt: '', notes: '' } });
	});

	it('names what is wrong', () => {
		expect(checkLoan({ ...input, piece: '' })).toEqual({ problem: 'piece-missing' });
		expect(checkLoan({ ...input, from: ' ' })).toEqual({ problem: 'from-missing' });
		expect(checkLoan({ ...input, dueAt: 'bald' })).toEqual({ problem: 'bad-date' });
	});
});
