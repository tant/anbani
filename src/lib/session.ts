import { State } from 'ts-fsrs';
import { LETTERS } from './letters';
import { parseKey, type Cards, type Skill } from './srs';

export type Task =
	| { kind: 'intro'; char: string }
	| { kind: 'question'; skill: Skill; char: string; key: string }
	| { kind: 'done'; nextDue: Date | null };

export const MAX_LEARNING_LETTERS = 4;
export const LOOKAHEAD_MS = 15 * 60_000;
export const SESSION_LENGTH = 20;

export function nextTask(cards: Cards, now: Date, lastKey?: string): Task {
	const entries = Object.entries(cards).sort(([, a], [, b]) => +a.due - +b.due);
	const ask = (list: typeof entries): Task => {
		const [key] = list.find(([k]) => k !== lastKey) ?? list[0];
		const { skill, item } = parseKey(key);
		return { kind: 'question', skill, char: item, key };
	};

	const due = entries.filter(([, c]) => +c.due <= +now);
	if (due.length) return ask(due);

	const introduced = new Set(entries.map(([k]) => parseKey(k).item));
	const learning = new Set(entries.filter(([, c]) => c.state !== State.Review).map(([k]) => parseKey(k).item));
	const fresh = LETTERS.find((l) => !introduced.has(l.char));
	if (fresh && learning.size < MAX_LEARNING_LETTERS) return { kind: 'intro', char: fresh.char };

	const soon = entries.filter(([, c]) => +c.due - +now <= LOOKAHEAD_MS);
	if (soon.length) return ask(soon);

	return { kind: 'done', nextDue: entries[0]?.[1].due ?? null };
}
