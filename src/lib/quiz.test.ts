import { describe, expect, it } from 'vitest';
import { ALPHABET } from './letters';
import { buildQuiz, scopeChars, summarize } from './quiz';
import { newCard } from './srs';

function seeded(seed = 7) {
	let s = seed;
	return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const all = ALPHABET.map((l) => l.char);

describe('quiz', () => {
	it('scopes letters in alphabet order', () => {
		expect(scopeChars('all', {}, [])).toEqual(all);
		const cards = { 'read:ბ': newCard(new Date()), 'recall:ა': newCard(new Date()) };
		expect(scopeChars('studied', cards, [])).toEqual(['ა', 'ბ']);
		expect(scopeChars('custom', {}, ['გ', 'x', 'ა'])).toEqual(['ა', 'გ']);
	});

	it('asks every letter exactly once', () => {
		const quiz = buildQuiz(all, 'read', seeded());
		expect(quiz.map((q) => q.char).sort()).toEqual([...all].sort());
		expect(quiz.every((q) => q.skill === 'read')).toBe(true);
	});

	it('splits mixed tests evenly between both question types', () => {
		const quiz = buildQuiz(all, 'mixed', seeded());
		const reads = quiz.filter((q) => q.skill === 'read').length;
		expect(Math.abs(reads - (quiz.length - reads))).toBeLessThanOrEqual(1);
	});

	it('summarises right and missed answers', () => {
		const s = summarize([
			{ char: 'ა', skill: 'read', chosen: 'ა' },
			{ char: 'ბ', skill: 'recall', chosen: 'ზ' }
		]);
		expect(s).toEqual({ right: 1, total: 2, wrong: [{ char: 'ბ', skill: 'recall', chosen: 'ზ' }] });
	});
});
