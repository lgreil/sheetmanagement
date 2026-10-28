import { describe, expect, it } from 'vitest';
import { bestOption, calendarLink, canSeePoll, choicesFromForm, daysOf, isOpen, optionLabel, pollDatesByMonth, pollFromForm, scoreOptions, type Poll, type PollResponse } from './polls.ts';

const poll: Poll = {
	id: 'p1',
	title: 'Probenwochenende',
	options: [
		{ id: 'o1', date: '2027-03-06' },
		{ id: 'o2', date: '2027-03-13', start: '10:00', end: '17:00' },
		{ id: 'o3', date: '2027-03-20' }
	],
	groups: ['Orga'],
	createdBy: 'vera@example.org',
	createdByName: 'Vera',
	createdAt: '2027-01-01T10:00:00Z',
	chosen: []
};
const answer = (name: string, choices: PollResponse['choices']): PollResponse => ({ email: `${name}@example.org`, name, choices, updatedAt: '' });

describe('date polls', () => {
	it('are only for their groups, whoever made them and those who plan', () => {
		expect(canSeePoll(poll, { email: 'ben@example.org', groups: ['orga '], plans: false })).toBe(true);
		expect(canSeePoll(poll, { email: 'ben@example.org', groups: ['Geigen'], plans: false })).toBe(false);
		expect(canSeePoll(poll, { email: 'vera@example.org', groups: [], plans: false })).toBe(true);
		expect(canSeePoll(poll, { email: 'ada@example.org', groups: [], plans: true })).toBe(true);
	});

	it('stay open until the end of the deadline, or until closed', () => {
		expect(isOpen({ ...poll, deadline: '2027-02-01' }, '2027-02-01')).toBe(true);
		expect(isOpen({ ...poll, deadline: '2027-02-01' }, '2027-02-02')).toBe(false);
		expect(isOpen({ ...poll, closedAt: '2027-01-05' }, '2027-01-06')).toBe(false);
	});

	it('rank the dates: most yes, then most maybe, then the earliest', () => {
		const responses = [answer('ada', { o1: 'maybe', o2: 'yes', o3: 'yes' }), answer('ben', { o2: 'yes', o3: 'maybe' }), answer('cem', { o3: 'yes', o2: 'no' })];
		expect(scoreOptions(poll, responses).map((score) => [score.option.id, score.yes, score.maybe, score.no])).toEqual([
			['o3', 2, 1, 0],
			['o2', 2, 0, 1],
			['o1', 0, 1, 0]
		]);
		expect(bestOption(poll, responses)?.id).toBe('o3');
		expect(bestOption(poll, [answer('ada', { o1: 'no' })])).toBeUndefined();
	});

	it('are read from the form, sorted by date', () => {
		const data = new FormData();
		data.set('title', '  Sommerfest ');
		for (const [date, start, end] of [
			['2027-07-10', '18:00', '22:00'],
			['', '', ''],
			['2027-07-03', '', '']
		]) {
			data.append('date', date);
			data.append('start', start);
			data.append('end', end);
		}
		data.append('groups', 'Orga');
		data.append('groups', 'Orga');
		const result = pollFromForm(data);
		expect(result).toEqual({
			poll: {
				title: 'Sommerfest',
				note: undefined,
				options: [
					{ id: 'o2', date: '2027-07-03', start: undefined, end: undefined },
					{ id: 'o1', date: '2027-07-10', start: '18:00', end: '22:00' }
				],
				groups: ['Orga'],
				deadline: undefined
			}
		});
	});

	it('need a title, two dates, a group and sensible times', () => {
		const form = (fields: [string, string][]) => {
			const data = new FormData();
			for (const [key, value] of fields) data.append(key, value);
			return data;
		};
		const dates: [string, string][] = [
			['date', '2027-07-03'],
			['date', '2027-07-10']
		];
		expect(pollFromForm(form([...dates, ['groups', 'Orga']]))).toEqual({ error: 'title' });
		expect(pollFromForm(form([['title', 'X'], ['date', '2027-07-03'], ['groups', 'Orga']]))).toEqual({ error: 'options' });
		expect(pollFromForm(form([['title', 'X'], ...dates]))).toEqual({ error: 'groups' });
		expect(pollFromForm(form([['title', 'X'], ...dates, ['start', '19:00'], ['end', '18:00'], ['groups', 'Orga']]))).toEqual({ error: 'time' });
	});

	it('take only real answers from the form', () => {
		const data = new FormData();
		data.set('choice:o1', 'yes');
		data.set('choice:o2', 'perhaps');
		data.set('comment', ' erst ab 11 ');
		expect(choicesFromForm(poll, data)).toEqual({ choices: { o1: 'yes' }, comment: 'erst ab 11' });
	});

	it('fill in a Google Calendar event for the chosen date', () => {
		const timed = new URL(calendarLink('Probe', poll.options[1], 'Europe/Berlin'));
		expect(timed.searchParams.get('dates')).toBe('20270313T100000/20270313T170000');
		expect(timed.searchParams.get('ctz')).toBe('Europe/Berlin');
		const allDay = new URL(calendarLink('Probe', poll.options[0], 'Europe/Berlin'));
		expect(allDay.searchParams.get('dates')).toBe('20270306/20270307');
		const noEnd = new URL(calendarLink('Probe', { id: 'x', date: '2027-03-13', start: '19:30' }, 'Europe/Berlin'));
		expect(noEnd.searchParams.get('dates')).toBe('20270313T193000/20270313T213000');
	});
});

describe('pollDatesByMonth', () => {
	it('puts each poll’s coming days under their months, once per day', () => {
		const weekend = { id: 'p1', title: 'Probenwochenende', options: [
			{ id: 'a', date: '2026-11-28', start: '10:00' },
			{ id: 'b', date: '2026-11-28', start: '14:00' },
			{ id: 'c', date: '2026-12-05' },
			{ id: 'd', date: '2026-10-01' }
		] };
		const meeting = { id: 'p2', title: 'Vorstandssitzung', options: [{ id: 'a', date: '2026-11-03' }] };
		expect([...pollDatesByMonth([weekend, meeting], '2026-10-23')]).toEqual([
			[
				'2026-11',
				[
					{ poll: { id: 'p1', title: 'Probenwochenende' }, days: ['2026-11-28'] },
					{ poll: { id: 'p2', title: 'Vorstandssitzung' }, days: ['2026-11-03'] }
				]
			],
			['2026-12', [{ poll: { id: 'p1', title: 'Probenwochenende' }, days: ['2026-12-05'] }]]
		]);
	});
});

describe('options over several days', () => {
	const weekend = { id: 'a', date: '2026-12-18', until: '2026-12-19', start: '10:00', end: '17:00' };

	it('are read from the form with their last day; one on or before the first is a single day', () => {
		const data = new FormData();
		data.set('title', 'Probenwochenende');
		for (const [date, until] of [
			['2026-12-18', '2026-12-19'],
			['2026-12-20', '2026-12-20'],
			['2026-12-27', '']
		]) {
			data.append('date', date);
			data.append('until', until);
			data.append('start', '');
			data.append('end', '');
		}
		data.append('groups', 'Orga');
		const result = pollFromForm(data);
		expect('poll' in result && result.poll.options.map((option) => [option.date, option.until])).toEqual([
			['2026-12-18', '2026-12-19'],
			['2026-12-20', undefined],
			['2026-12-27', undefined]
		]);
		data.set('until', 'morgen');
		expect(pollFromForm(data)).toEqual({ error: 'time' });
	});

	it('cover every day from the first to the last, at most a fortnight', () => {
		expect(daysOf(weekend)).toEqual(['2026-12-18', '2026-12-19']);
		expect(daysOf({ date: '2026-12-31', until: '2027-01-01' })).toEqual(['2026-12-31', '2027-01-01']);
		expect(daysOf({ date: '2026-12-18' })).toEqual(['2026-12-18']);
		expect(daysOf({ date: '2026-01-01', until: '2026-12-31' })).toHaveLength(15);
	});

	it('read as one range', () => {
		const label = optionLabel(weekend, 'de-DE');
		expect([label.weekday, label.day, label.month]).toEqual(['Fr–Sa', '18–19', 'Dez']);
		// Intl puts thin spaces around the dash.
		expect(label.long.replace(/\s/g, ' ')).toBe('Freitag, 18. – Samstag, 19. Dezember 2026, 10:00–17:00');
	});

	it('go into the calendar from the first day’s start to the last day’s end', () => {
		expect(new URL(calendarLink('Probenwochenende', weekend, 'Europe/Berlin')).searchParams.get('dates')).toBe('20261218T100000/20261219T170000');
		expect(new URL(calendarLink('Probenwochenende', { id: 'b', date: '2026-12-18', until: '2026-12-19' }, 'Europe/Berlin')).searchParams.get('dates')).toBe('20261218/20261220');
	});

	it('show on the calendar on each of their days', () => {
		const poll = { id: 'p1', title: 'Probenwochenende', options: [{ id: 'a', date: '2026-11-30', until: '2026-12-01' }] };
		expect([...pollDatesByMonth([poll], '2026-10-23')].map(([month, polls]) => [month, polls[0].days])).toEqual([
			['2026-11', ['2026-11-30']],
			['2026-12', ['2026-12-01']]
		]);
	});
});
