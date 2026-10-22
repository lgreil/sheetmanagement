import { describe, expect, it } from 'vitest';
import { config } from '#lib/config/index.ts';
import { LAYOUT } from '#lib/repertoire/sheet.ts';
import { appliesTo, buildPieceNotes, checkNote, forConcert, notesOf, sectionOptions } from './piece-notes.ts';

const header = Object.values(LAYOUT.pieceNotes.columns);

describe('buildPieceNotes', () => {
	it('reads notes and skips rows without piece or text', () => {
		const { notes } = buildPieceNotes([
			header,
			['Egmont', 'Streicher', '', 'Takt 40 nach 88', 'David', '2026-10-01', 'a1'],
			['Egmont', '', '', '', 'David', '2026-10-01', 'a2'],
			['', '', '', 'Ohne Stück', '', '', 'a3']
		]);
		expect(notes).toEqual([
			{ row: 2, id: 'a1', pieceName: 'Egmont', section: 'Streicher', concert: '', text: 'Takt 40 nach 88', by: 'David', at: '2026-10-01' }
		]);
	});
});

describe('notesOf', () => {
	it('finds a piece’s notes by title, newest first', () => {
		const notes = [
			{ row: 2, pieceName: 'Egmont Ouvertüre', at: '2026-01-01' },
			{ row: 3, pieceName: 'egmont ouverture', at: '2026-05-01' },
			{ row: 4, pieceName: 'Morgenstimmung', at: '2026-06-01' }
		];
		expect(notesOf(notes, 'Egmont Ouvertüre').map((note) => note.row)).toEqual([3, 2]);
	});
});

describe('appliesTo', () => {
	const note = (section: string) => ({ section });

	it('shows notes for everyone to everyone', () => {
		expect(appliesTo(note(''), ['Flöte'], config)).toBe(true);
	});

	it('matches a section by the instrument’s family', () => {
		expect(appliesTo(note('Streicher'), ['Geige'], config)).toBe(true);
		expect(appliesTo(note('Streicher'), ['Flöte'], config)).toBe(false);
	});

	it('matches an instrument by name, label or spelling', () => {
		expect(appliesTo(note('Bratsche'), ['Viola'], config)).toBe(true);
		expect(appliesTo(note('Viola'), ['Viola'], config)).toBe(true);
		expect(appliesTo(note('Cello, Kontrabass'), ['Violoncello'], config)).toBe(true);
		expect(appliesTo(note('Bratsche'), ['Geige'], config)).toBe(false);
	});

	it('shows a note whose "Für" it can’t read to everyone', () => {
		expect(appliesTo(note('die hinteren Pulte'), ['Flöte'], config)).toBe(true);
	});

	it('shows every note to someone without an instrument', () => {
		expect(appliesTo(note('Streicher'), [], config)).toBe(true);
	});
});

describe('forConcert', () => {
	it('takes notes without a concert, and those for this one', () => {
		expect(forConcert({ concert: '' }, 'Herbstkonzert 2026')).toBe(true);
		expect(forConcert({ concert: 'herbstkonzert 2026' }, 'Herbstkonzert 2026')).toBe(true);
		expect(forConcert({ concert: 'Sommerkonzert 2026' }, 'Herbstkonzert 2026')).toBe(false);
		expect(forConcert({ concert: 'Sommerkonzert 2026' }, undefined)).toBe(false);
	});
});

describe('sectionOptions', () => {
	it('offers sections first, then instruments as the app names them', () => {
		const options = sectionOptions(config);
		expect(options.sections).toContain('Streicher');
		expect(options.sections).not.toContain('Stimmen für alle');
		expect(options.instruments).toContain('Bratsche');
		expect(options.instruments).not.toContain('Viola');
	});
});

describe('checkNote', () => {
	const offered = { sections: ['Streicher'], concerts: ['Herbstkonzert 2026'] };

	it('accepts what the page offered', () => {
		expect(checkNote({ text: ' Ohne Wiederholung \r\n', section: 'Streicher', concert: 'Herbstkonzert 2026' }, offered)).toEqual({
			values: { text: 'Ohne Wiederholung', section: 'Streicher', concert: 'Herbstkonzert 2026' }
		});
	});

	it('refuses empty, long and unknown values', () => {
		expect(checkNote({ text: '  ', section: '', concert: '' }, offered)).toEqual({ problem: 'empty' });
		expect(checkNote({ text: 'x'.repeat(501), section: '', concert: '' }, offered)).toEqual({ problem: 'too-long' });
		expect(checkNote({ text: 'a', section: 'Bläser', concert: '' }, offered)).toEqual({ problem: 'section' });
		expect(checkNote({ text: 'a', section: '', concert: 'Gibt es nicht' }, offered)).toEqual({ problem: 'concert' });
	});
});
