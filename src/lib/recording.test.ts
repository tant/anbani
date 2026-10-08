import { describe, expect, it } from 'vitest';
import { ALPHABET } from './letters';
import { CATALOGUE, TAKES, baseMime, byType, extensionFor, nextUnrecorded, pickMime, recordedCount, takeName } from './recording';

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

	it('walks on to the next item that still needs takes', () => {
		const first = CATALOGUE[0];
		const done = new Set([first.id]);
		expect(nextUnrecorded(done)?.id).toBe(CATALOGUE[1].id);
		expect(nextUnrecorded(done, CATALOGUE[1].id)?.id).toBe(CATALOGUE[2].id);
	});

	it('wraps around to what was skipped earlier', () => {
		const done = new Set(CATALOGUE.map((i) => i.id));
		done.delete(CATALOGUE[0].id);
		expect(nextUnrecorded(done, CATALOGUE.at(-1)!.id)?.id).toBe(CATALOGUE[0].id);
	});

	it('reports nothing left when every item has its takes', () => {
		expect(nextUnrecorded(new Set(CATALOGUE.map((i) => i.id)))).toBeUndefined();
	});

	it('prefers Opus, and falls back to what the browser does support', () => {
		expect(pickMime(() => true)).toBe('audio/webm;codecs=opus');
		expect(pickMime((m) => m.startsWith('audio/mp4'))).toBe('audio/mp4');
		expect(pickMime(() => false)).toBeUndefined();
	});

	it('names the upload by its container, without the codec parameter', () => {
		expect(baseMime('audio/webm;codecs=opus')).toBe('audio/webm');
		expect(extensionFor('audio/webm;codecs=opus')).toBe('webm');
		expect(extensionFor('audio/ogg;codecs=opus')).toBe('ogg');
		expect(extensionFor('audio/mp4')).toBe('m4a');
	});

	it('names a stored take after the item, in letters a server will keep', () => {
		const letter = CATALOGUE.find((i) => i.text === 'კ')!;
		expect(takeName(letter, 2, 'audio/webm;codecs=opus')).toBe('letter-k-2.webm');
		expect(takeName(CATALOGUE.find((i) => i.id === 'phrase:how-are-you')!, 1, 'audio/mp4')).toBe('phrase-rogor-khar-1.m4a');
	});

	it('asks for three takes', () => {
		expect(TAKES).toBe(3);
	});
});
