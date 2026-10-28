import { describe, expect, it } from 'vitest';
import { bestOption, calendarLink, canSeePoll, choicesFromForm, isOpen, pollDatesByMonth, pollFromForm, scoreOptions, type Poll, type PollResponse } from './polls.ts';

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
