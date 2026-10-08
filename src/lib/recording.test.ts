import { describe, expect, it } from 'vitest';
import { ALPHABET } from './letters';
import { byType, CATALOGUE, recordedCount } from './recording';

describe('recording catalogue', () => {
	it('gives every item a unique id', () => {
		const ids = CATALOGUE.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('covers all 33 letters', () => {
		expect(byType('letter')).toHaveLength(ALPHABET.length);
	});

	it('carries Georgian text and a reading for every item', () => {
		expect(CATALOGUE.every((i) => /[ა-ჿ]/.test(i.text) && i.translit.length > 0)).toBe(true);
	});

	it('gives every cluster an example word that contains it', () => {
		expect(byType('cluster').every((i) => i.example?.includes(i.text))).toBe(true);
	});

	it('counts what has been recorded, overall and per type', () => {
		const done = new Set(byType('word').slice(0, 3).map((i) => i.id));
		expect(recordedCount(done, 'word').done).toBe(3);
		expect(recordedCount(done, 'letter').done).toBe(0);
		expect(recordedCount(done).total).toBe(CATALOGUE.length);
	});
});
