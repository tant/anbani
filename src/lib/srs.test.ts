import { Rating, State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { cardKey, dueCount, gradeAnswer, isNewer, letterStatus, newCard, parseKey, reviewCard, reviveCard } from './srs';

const now = new Date('2026-01-01T00:00:00Z');

describe('srs', () => {
	it('grades by correctness and speed', () => {
		expect(gradeAnswer(false, 100)).toBe(Rating.Again);
		expect(gradeAnswer(true, 1000)).toBe(Rating.Good);
		expect(gradeAnswer(true, 6000)).toBe(Rating.Hard);
	});

	it('round-trips keys', () => {
		expect(parseKey(cardKey('recall', 'ა'))).toEqual({ skill: 'recall', item: 'ა' });
	});

	it('reports letter status', () => {
		expect(letterStatus({}, 'ა')).toBe('unseen');
		expect(letterStatus({ 'read:ა': newCard(now) }, 'ა')).toBe('learning');
		const solid = { ...newCard(now), state: State.Review, stability: 10 };
		expect(letterStatus({ 'read:ა': solid, 'recall:ა': solid }, 'ა')).toBe('known');
		expect(letterStatus({ 'read:ა': solid, 'recall:ა': { ...solid, stability: 2 } }, 'ა')).toBe('learning');
	});

	it('prefers the card reviewed later, then the one with more reps', () => {
		const a = { ...newCard(now), last_review: new Date('2026-01-02'), reps: 1 };
		const b = { ...newCard(now), last_review: new Date('2026-01-01'), reps: 5 };
		expect(isNewer(a, b)).toBe(true);
		expect(isNewer(b, a)).toBe(false);
		expect(isNewer({ ...b, reps: 6 }, b)).toBe(true);
	});

	it('revives dates from JSON', () => {
		const card = reviveCard(JSON.parse(JSON.stringify(reviewCard(newCard(now), Rating.Good, now))));
		expect(card.due).toBeInstanceOf(Date);
		expect(card.last_review).toBeInstanceOf(Date);
	});

	it('brings a missed card back within minutes and counts due cards', () => {
		const missed = reviewCard(newCard(now), Rating.Again, now);
		expect(+missed.due - +now).toBeLessThanOrEqual(10 * 60_000);
		expect(dueCount({ a: newCard(now), b: missed }, now)).toBe(1);
	});
});
