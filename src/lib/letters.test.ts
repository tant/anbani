import { describe, expect, it } from 'vitest';
import { ALPHABET, LETTERS, byChar } from './letters';

describe('letters', () => {
	it('has the 33 modern letters once each, in alphabet order', () => {
		expect(LETTERS).toHaveLength(33);
		expect(ALPHABET.map((l) => l.char).join('')).toBe('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ');
	});

	it('gives every letter a distinct sound', () => {
		expect(new Set(LETTERS.map((l) => l.translit)).size).toBe(33);
	});

	it('lists three existing look-alikes other than the letter itself', () => {
		for (const l of LETTERS) {
			expect(l.looksLike).toHaveLength(3);
			for (const c of l.looksLike) {
				expect(byChar.has(c)).toBe(true);
				expect(c).not.toBe(l.char);
			}
		}
	});

	it('puts every letter in a sound group with at least four other letters', () => {
		for (const l of LETTERS) {
			expect(LETTERS.filter((o) => o.group === l.group).length).toBeGreaterThanOrEqual(5);
		}
	});

	it('has a hint in both languages', () => {
		for (const l of LETTERS) {
			expect(l.hint.vi.length).toBeGreaterThan(5);
			expect(l.hint.en.length).toBeGreaterThan(5);
		}
	});
});
