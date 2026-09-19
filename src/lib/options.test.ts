import { describe, expect, it } from 'vitest';
import { LETTERS, byChar } from './letters';
import { buildOptions, pickDistractors, type OptionContext } from './options';

function seeded(seed = 1) {
	let s = seed;
	return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const ctx = (over: Partial<OptionContext> = {}): OptionContext => ({ known: new Set(), confusions: {}, rng: seeded(), ...over });

describe('options', () => {
	it('returns exactly n unique distractors without the target', () => {
		for (const l of LETTERS)
			for (const skill of ['read', 'recall'] as const)
				for (let n = 2; n <= 5; n++) {
					const d = pickDistractors(l.char, skill, n, ctx());
					expect(d).toHaveLength(n);
					expect(new Set(d).size).toBe(n);
					expect(d).not.toContain(l.char);
				}
	});

	it('puts past mistakes first, most frequent first', () => {
		const d = pickDistractors('ა', 'read', 3, ctx({ confusions: { 'ა': { 'ო': 1, 'ჰ': 3 } } }));
		expect(d.slice(0, 2)).toEqual(['ჰ', 'ო']);
	});

	it('uses same-sound-group letters for read', () => {
		const d = pickDistractors('ქ', 'read', 3, ctx());
		for (const c of d) expect(byChar.get(c)!.group).toBe('velar');
	});

	it('uses look-alike glyphs for recall', () => {
		expect(pickDistractors('მ', 'recall', 3, ctx()).sort()).toEqual(['შ', 'ძ', 'ნ'].sort());
	});

	it('builds n + 1 options containing the target once', () => {
		const o = buildOptions('ა', 'recall', 5, ctx());
		expect(o).toHaveLength(6);
		expect(o.filter((c) => c === 'ა')).toHaveLength(1);
	});
});
