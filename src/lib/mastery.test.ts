import { describe, expect, it } from 'vitest';
import { INITIAL, sampleByWeight, scoreAfter, targetFor, usesRandomFont, weightFor } from './mastery';

describe('mastery score', () => {
	it('starts a freshly introduced letter at 30', () => {
		expect(INITIAL).toBe(30);
	});

	it('aims at 100 only for answers under a second', () => {
		expect(targetFor(800)).toBe(100);
		expect(targetFor(1500)).toBe(85);
		expect(targetFor(4000)).toBe(55);
		expect(targetFor(9000)).toBe(40);
	});

	it('moves a third of the way towards what the speed deserves', () => {
		expect(scoreAfter(30, true, 800)).toBe(53); // 30 + (100 - 30) / 3
		expect(scoreAfter(90, true, 4000)).toBe(78); // slow answers pull a high score down
	});

	it('takes 10 off a wrong answer, without smoothing', () => {
		expect(scoreAfter(64, false, 500)).toBe(54);
		expect(scoreAfter(4, false, 500)).toBe(0);
	});

	it('never leaves the 0 to 100 range', () => {
		expect(scoreAfter(0, false, 100)).toBe(0);
		expect(scoreAfter(99, true, 200)).toBe(99);
		expect(scoreAfter(100, true, 200)).toBe(100);
	});

	it('needs many fast answers to reach the top', () => {
		let score = INITIAL;
		for (let i = 0; i < 12; i += 1) score = scoreAfter(score, true, 700);
		expect(score).toBeGreaterThan(95);
	});

	it('switches to a random letter style above 80', () => {
		expect(usesRandomFont(80)).toBe(false);
		expect(usesRandomFont(81)).toBe(true);
	});

	it('keeps asking a mastered letter about one time in twenty', () => {
		expect(weightFor(100)).toBe(5);
		expect(weightFor(30)).toBe(70);
		expect(weightFor(0)).toBe(100);
	});
});

describe('sampleByWeight', () => {
	const chars = ['a', 'b', 'c'];

	it('returns as many distinct letters as asked for', () => {
		const picked = sampleByWeight(chars, { a: 100, b: 100, c: 100 }, 2, () => 0.5);
		expect(picked).toHaveLength(2);
		expect(new Set(picked).size).toBe(2);
	});

	it('cannot return more letters than the pool holds', () => {
		expect(sampleByWeight(chars, {}, 10, () => 0.5)).toHaveLength(3);
	});

	it('asks the weak letters far more often than the mastered ones', () => {
		const mastery = { a: 100, b: 100, c: 0 };
		let weak = 0;
		let rng = 0;
		for (let i = 0; i < 1000; i += 1) {
			rng = (rng * 9301 + 49297) % 233280; // repeatable pseudo-random
			if (sampleByWeight(chars, mastery, 1, () => rng / 233280)[0] === 'c') weak += 1;
		}
		expect(weak).toBeGreaterThan(800);
	});
});
