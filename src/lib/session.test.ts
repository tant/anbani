import { State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { LETTERS } from './letters';
import { nextTask } from './session';
import { newCard, type Cards } from './srs';

const now = new Date('2026-01-01T00:00:00Z');
const at = (min: number) => new Date(+now + min * 60_000);

function cardsFor(chars: string[], patch: object): Cards {
	const cards: Cards = {};
	for (const c of chars) for (const s of ['read', 'recall']) cards[`${s}:${c}`] = { ...newCard(now), ...patch };
	return cards;
}

describe('nextTask', () => {
	it('introduces the first letter to a new learner', () => {
		expect(nextTask({}, now)).toEqual({ kind: 'intro', char: LETTERS[0].char });
	});

	it('asks due cards before introducing anything', () => {
		const task = nextTask(cardsFor(['ა'], {}), now);
		expect(task).toMatchObject({ kind: 'question', char: 'ა' });
	});

	it('avoids repeating the card just asked', () => {
		expect(nextTask(cardsFor(['ა'], {}), now, 'read:ა')).toMatchObject({ key: 'recall:ა', skill: 'recall' });
	});

	it('introduces the next letter while fewer than four are in learning', () => {
		const cards = cardsFor(['ა'], { state: State.Learning, due: at(5) });
		expect(nextTask(cards, now)).toEqual({ kind: 'intro', char: LETTERS[1].char });
	});

	it('works on soon-due cards instead of introducing a fifth letter', () => {
		const cards = cardsFor(LETTERS.slice(0, 4).map((l) => l.char), { state: State.Learning, due: at(5) });
		expect(nextTask(cards, now)).toMatchObject({ kind: 'question' });
	});

	it('is done when every letter is in review and nothing is due soon', () => {
		const cards = cardsFor(LETTERS.map((l) => l.char), { state: State.Review, due: at(60 * 48) });
		expect(nextTask(cards, now)).toEqual({ kind: 'done', nextDue: at(60 * 48) });
	});
});
