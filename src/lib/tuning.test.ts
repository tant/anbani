import { describe, expect, it } from 'vitest';
import { ALPHABET } from './letters';
import { State } from 'ts-fsrs';
import { confusable, confusedWith, difficultyBump, freq, harder, intervalScale, nextLetter, soundTwins, TEACHING_ORDER, tuneDue } from './tuning';
import { newCard, reviewCard } from './srs';
import { Rating } from 'ts-fsrs';

describe('frequency data', () => {
	it('covers every letter and adds up to a whole', () => {
		const total = ALPHABET.reduce((sum, l) => sum + freq(l.char), 0);
		expect(ALPHABET.every((l) => freq(l.char) > 0)).toBe(true);
		expect(total).toBeGreaterThan(99);
		expect(total).toBeLessThan(101);
	});

	it('teaches the commonest letters first', () => {
		expect(TEACHING_ORDER[0]).toBe('ა');
		expect(TEACHING_ORDER.indexOf('ი')).toBeLessThan(TEACHING_ORDER.indexOf('ჰ'));
		expect(TEACHING_ORDER).toHaveLength(ALPHABET.length);
	});
});

describe('confusable letters', () => {
	it('pairs a sound with its ejective twin, both ways', () => {
		expect(soundTwins('ც')).toEqual(['წ']); // ts and ts'
		expect(soundTwins('წ')).toEqual(['ც']);
		expect(soundTwins('თ')).toEqual(['ტ']); // t and t'
		expect(soundTwins('კ')).toEqual(['ქ']); // k' and k
	});

	it('leaves a sound with no twin alone', () => {
		expect(soundTwins('ა')).toEqual([]);
		expect(soundTwins('ყ')).toEqual([]); // q' stands on its own
	});

	it('counts look-alikes as confusable too', () => {
		expect(confusable('ც')).toContain('წ');
		expect(confusable('ა')).toEqual(expect.arrayContaining(['პ', 'ჰ', 'ი']));
	});
});

describe('introducing letters', () => {
	it('offers the commonest letter that is still unseen', () => {
		expect(nextLetter(new Set(), new Set())).toBe('ა');
		expect(nextLetter(new Set(['ა']), new Set(['ა']))).toBe('ი');
	});

	it('holds a letter back while its twin is still being learnt', () => {
		const introduced = new Set(TEACHING_ORDER.slice(0, TEACHING_ORDER.indexOf('წ')));
		const next = nextLetter(introduced, new Set(['ც']));
		expect(next).not.toBe('წ');
	});

	it('gives up the spacing rule rather than run out of letters', () => {
		const all = new Set(TEACHING_ORDER.slice(0, -1));
		const last = TEACHING_ORDER[TEACHING_ORDER.length - 1];
		expect(nextLetter(all, new Set(confusable(last)))).toBe(last);
	});
});

describe('difficulty and intervals', () => {
	it('starts a letter with a sound twin harder than one without', () => {
		expect(difficultyBump('ც')).toBeGreaterThan(difficultyBump('ა'));
		expect(difficultyBump('ც')).toBeLessThanOrEqual(1.5);
	});

	it('adds the bump once FSRS has set a difficulty, not before', () => {
		const now = new Date('2026-10-08T00:00:00Z');
		const first = reviewCard(newCard(now), Rating.Good, now);
		const bumped = harder(first, State.New, 'ც');
		expect(bumped.difficulty).toBeCloseTo(first.difficulty + difficultyBump('ც'));
		// a later review keeps whatever FSRS worked out, with no second bump
		expect(harder(first, State.Review, 'ც').difficulty).toBe(first.difficulty);
	});

	it('reviews common letters sooner than rare ones', () => {
		expect(intervalScale('ა')).toBeLessThan(1);
		expect(intervalScale('ჭ')).toBeGreaterThan(1);
	});

	it('moves the due date by that scale and leaves the rest of the card alone', () => {
		const now = new Date('2026-10-08T00:00:00Z');
		const card = { ...newCard(now), due: new Date(+now + 10 * 86_400_000) };
		const tuned = tuneDue(card, 'ა', now);
		expect(+tuned.due - +now).toBe(8.5 * 86_400_000);
		expect(tuned.scheduled_days).toBe(8.5);
		expect(tuned.reps).toBe(card.reps);
	});
});

describe('after a mistake', () => {
	it('points at the letter that was actually picked', () => {
		expect(confusedWith('ც', 'წ', new Set(['წ']))).toBe('წ');
	});

	it('falls back to a letter it is easy to confuse', () => {
		expect(confusedWith('ც', 'ც', new Set(['წ']))).toBe('წ');
	});

	it('stays quiet when nothing confusable has been met yet', () => {
		expect(confusedWith('ც', 'ც', new Set())).toBeUndefined();
	});
});
