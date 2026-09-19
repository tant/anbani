import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs';

/** read: glyph → sound. recall: sound → glyph. */
export type Skill = 'read' | 'recall';
export const SKILLS: Skill[] = ['read', 'recall'];

export type Cards = Record<string, Card>;
export type LetterStatus = 'unseen' | 'learning' | 'known';

export const SLOW_MS = 5000;
export const KNOWN_STABILITY_DAYS = 7;

const scheduler = fsrs();

export const cardKey = (skill: Skill, item: string) => `${skill}:${item}`;

export function parseKey(key: string): { skill: Skill; item: string } {
	const i = key.indexOf(':');
	return { skill: key.slice(0, i) as Skill, item: key.slice(i + 1) };
}

export function gradeAnswer(correct: boolean, ms: number): Grade {
	if (!correct) return Rating.Again;
	return ms > SLOW_MS ? Rating.Hard : Rating.Good;
}

export const newCard = (now: Date): Card => createEmptyCard(now);

export const reviewCard = (card: Card, grade: Grade, now: Date): Card => scheduler.next(card, now, grade).card;

/** Cards read back from JSON carry ISO strings where ts-fsrs expects Dates. */
export function reviveCard(raw: Card): Card {
	return { ...raw, due: new Date(raw.due), last_review: raw.last_review ? new Date(raw.last_review) : undefined };
}

/** True when `a` reflects more practice than `b`. */
export function isNewer(a: Card, b: Card): boolean {
	const ta = a.last_review ? +new Date(a.last_review) : 0;
	const tb = b.last_review ? +new Date(b.last_review) : 0;
	return ta !== tb ? ta > tb : a.reps > b.reps;
}

export function letterStatus(cards: Cards, char: string): LetterStatus {
	const cs = SKILLS.map((s) => cards[cardKey(s, char)]);
	if (cs.every((c) => !c)) return 'unseen';
	const known = cs.every((c) => c && c.state === State.Review && c.stability >= KNOWN_STABILITY_DAYS);
	return known ? 'known' : 'learning';
}

export const dueCount = (cards: Cards, now: Date) => Object.values(cards).filter((c) => +c.due <= +now).length;
