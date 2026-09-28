import { GLYPH_FONTS, type GlyphFont } from './settings.svelte';

/**
 * How well a letter is known, 0 to 100, counting both directions at once: the same score moves
 * whether the learner read the glyph or picked it from the sound.
 *
 * 100 means recognised correctly in under a second, in any letter style. The score decides how often
 * a letter shows up in a test; it does not touch the FSRS review schedule, which runs the Learn mode.
 */
export type Mastery = Record<string, number>;

/** A letter starts here the moment it is introduced. */
export const INITIAL = 30;
/** A wrong answer drops straight down, with no smoothing, so the letter resurfaces at once. */
export const WRONG_PENALTY = 10;
/** A correct answer moves this share of the way towards what its speed deserves. */
export const SMOOTHING = 1 / 3;
/** Above this, questions stop using the learner's own letter style and pick one at random. */
export const RANDOM_FONT_ABOVE = 80;
/** Even a perfect letter keeps this weight, which works out at roughly 5% of a 20-question test. */
export const FLOOR_WEIGHT = 5;

/** Answer speed a learner has to beat for the top score. */
const SPEED_TARGETS: [ms: number, target: number][] = [
	[1000, 100],
	[2000, 85],
	[3500, 70],
	[5000, 55]
];
const SLOWEST_TARGET = 40;

export const targetFor = (ms: number) => SPEED_TARGETS.find(([limit]) => ms < limit)?.[1] ?? SLOWEST_TARGET;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreAfter(score: number, correct: boolean, ms: number): number {
	if (!correct) return clamp(score - WRONG_PENALTY);
	const target = targetFor(ms);
	return clamp(score + (target - score) * SMOOTHING);
}

/** At and above this the letter counts as known; below it the learner is still building it up. */
export const KNOWN_AT = 80;

export const band = (score: number | undefined): 'unseen' | 'learning' | 'known' =>
	score === undefined ? 'unseen' : score >= KNOWN_AT ? 'known' : 'learning';

/** Weight for picking test questions: the further from 100, the more often the letter is asked. */
export const weightFor = (score: number) => Math.max(FLOOR_WEIGHT, 100 - score);

export const usesRandomFont = (score: number) => score > RANDOM_FONT_ABOVE;

/** Bundled styles only; the device font has no staff metrics of its own. */
const BUNDLED = GLYPH_FONTS.filter((f) => f !== 'system');

export const randomFont = (rng: () => number = Math.random): GlyphFont => BUNDLED[Math.floor(rng() * BUNDLED.length)];

/** Picks `count` letters without repeats, favouring the ones with the lowest scores. */
export function sampleByWeight(chars: string[], mastery: Mastery, count: number, rng: () => number = Math.random): string[] {
	const pool = [...chars];
	const picked: string[] = [];
	while (picked.length < count && pool.length) {
		const weights = pool.map((c) => weightFor(mastery[c] ?? 0));
		let roll = rng() * weights.reduce((a, b) => a + b, 0);
		let i = weights.findIndex((w) => (roll -= w) < 0);
		if (i < 0) i = pool.length - 1;
		picked.push(pool.splice(i, 1)[0]);
	}
	return picked;
}
