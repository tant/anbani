import { State, type Card } from 'ts-fsrs';
import { FREQUENCY } from './frequency.generated';
import { ALPHABET, byChar } from './letters';

/**
 * What FSRS cannot see on its own: that one letter looks like another, that two sounds differ only
 * by a puff of air, and that some letters carry most of a Georgian page while others barely appear.
 *
 * These only steer which letter comes next and how tight its reviews sit. The grading itself stays
 * with FSRS.
 */

export const freq = (char: string) => FREQUENCY[char] ?? 0;

/** Letters first, the ones that carry the most text. */
export const TEACHING_ORDER: string[] = ALPHABET.map((l) => l.char).sort((a, b) => freq(b) - freq(a));

/**
 * Sounds that differ only in the ejective burst, such as ts and ts'. The data already says it: the
 * romanisation of the ejective is its plain twin plus an apostrophe.
 */
export function soundTwins(char: string): string[] {
	const sound = byChar.get(char)?.translit;
	if (!sound) return [];
	const twin = sound.endsWith("'") ? sound.slice(0, -1) : `${sound}'`;
	return ALPHABET.filter((l) => l.translit === twin).map((l) => l.char);
}

/** Letters this one is easy to mix up with, by shape or by sound. */
export function confusable(char: string): string[] {
	const letter = byChar.get(char);
	return letter ? [...new Set([...soundTwins(char), ...letter.looksLike])] : [];
}

/**
 * The next letter worth introducing: the most common one left, skipped while a letter it is easy to
 * confuse is still being learnt, so the pair is never met at the same time.
 */
export function nextLetter(introduced: Set<string>, learning: Set<string>): string | undefined {
	const free = (char: string) => !confusable(char).some((c) => learning.has(c));
	const left = TEACHING_ORDER.filter((c) => !introduced.has(c));
	return left.find(free) ?? left[0];
}

/**
 * A letter with a sound twin, or with close look-alikes, is harder than its answers alone suggest.
 * FSRS works out a card's difficulty at the first review, so the bump is added right after that one
 * and carried forward from there; setting it any earlier would simply be overwritten.
 */
export function harder(card: Card, before: State, char: string): Card {
	if (before !== State.New) return card;
	return { ...card, difficulty: Math.min(10, card.difficulty + difficultyBump(char)) };
}

export function difficultyBump(char: string): number {
	const bump = (soundTwins(char).length ? 0.8 : 0) + Math.min(3, byChar.get(char)?.looksLike.length ?? 0) * 0.2;
	return Math.min(1.5, bump);
}

/** Common letters come back sooner; a rare letter can wait, since missing it blocks less reading. */
export function intervalScale(char: string): number {
	const f = freq(char);
	if (f >= 5) return 0.85;
	if (f >= 2) return 0.95;
	if (f >= 0.8) return 1;
	return 1.15;
}

const DAY = 86_400_000;

/** Applies the frequency scaling to a card FSRS has just scheduled. */
export function tuneDue(card: Card, char: string, now: Date): Card {
	const scale = intervalScale(char);
	if (scale === 1) return card;
	const gap = Math.max(0, +card.due - +now) * scale;
	return { ...card, due: new Date(+now + gap), scheduled_days: Math.round((gap / DAY) * 10) / 10 };
}

/**
 * Right after a mistake, ask the letter it was confused with: telling the pair apart is the thing
 * that actually needs practice.
 */
export function confusedWith(char: string, chosen: string, known: Set<string>): string | undefined {
	if (chosen !== char && known.has(chosen)) return chosen;
	return confusable(char).find((c) => known.has(c));
}
