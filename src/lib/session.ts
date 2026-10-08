import { State } from 'ts-fsrs';
import { parseKey, type Cards, type Skill } from './srs';
import { confusedWith, nextLetter } from './tuning';

export type Task =
	| { kind: 'intro'; char: string }
	| { kind: 'question'; skill: Skill; char: string; key: string }
	| { kind: 'done'; nextDue: Date | null };

export const MAX_LEARNING_LETTERS = 4;
export const LOOKAHEAD_MS = 15 * 60_000;
export const SESSION_LENGTH = 20;

export function nextTask(cards: Cards, now: Date, lastKey?: string, confusion?: { char: string; chosen: string }): Task {
	const entries = Object.entries(cards).sort(([, a], [, b]) => +a.due - +b.due);
	const ask = (list: typeof entries): Task => {
		const [key] = list.find(([k]) => k !== lastKey) ?? list[0];
		const { skill, item } = parseKey(key);
		return { kind: 'question', skill, char: item, key };
	};

	const introducedChars = new Set(entries.map(([k]) => parseKey(k).item));

	// Straight after a mistake, put the letter it was confused with next: the pair is what needs work.
	if (confusion) {
		const twin = confusedWith(confusion.char, confusion.chosen, introducedChars);
		const pair = twin ? entries.filter(([k]) => parseKey(k).item === twin && k !== lastKey) : [];
		if (pair.length) return ask(pair);
	}

	const due = entries.filter(([, c]) => +c.due <= +now);
	if (due.length) return ask(due);

	const learning = new Set(entries.filter(([, c]) => c.state !== State.Review).map(([k]) => parseKey(k).item));
	const fresh = nextLetter(introducedChars, learning);
	if (fresh && learning.size < MAX_LEARNING_LETTERS) return { kind: 'intro', char: fresh };

	const soon = entries.filter(([, c]) => +c.due - +now <= LOOKAHEAD_MS);
	if (soon.length) return ask(soon);

	return { kind: 'done', nextDue: entries[0]?.[1].due ?? null };
}
