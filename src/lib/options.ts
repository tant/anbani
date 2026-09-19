import { LETTERS, byChar } from './letters';
import type { Skill } from './srs';

export type Rng = () => number;

export interface OptionContext {
	/** Letters already introduced to this learner. */
	known: Set<string>;
	/** confusions[target][picked] = how often `picked` was chosen for `target`. */
	confusions: Record<string, Record<string, number>>;
	rng: Rng;
}

export function shuffle<T>(xs: T[], rng: Rng): T[] {
	const a = [...xs];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function pickDistractors(target: string, skill: Skill, n: number, ctx: OptionContext): string[] {
	const letter = byChar.get(target)!;
	const mistakes = Object.entries(ctx.confusions[target] ?? {})
		.sort((a, b) => b[1] - a[1])
		.map(([c]) => c);
	const similar = skill === 'read' ? LETTERS.filter((l) => l.group === letter.group).map((l) => l.char) : letter.looksLike;
	const tiers = [mistakes, shuffle(similar, ctx.rng), shuffle([...ctx.known], ctx.rng), shuffle(LETTERS.map((l) => l.char), ctx.rng)];

	const out: string[] = [];
	for (const c of tiers.flat()) {
		if (out.length === n) break;
		if (c !== target && !out.includes(c)) out.push(c);
	}
	return out;
}

export const buildOptions = (target: string, skill: Skill, n: number, ctx: OptionContext) =>
	shuffle([target, ...pickDistractors(target, skill, n, ctx)], ctx.rng);
