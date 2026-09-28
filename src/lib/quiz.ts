import { ALPHABET } from './letters';
import { sampleByWeight, type Mastery } from './mastery';
import { shuffle, type Rng } from './options';
import { letterStatus, type Cards, type Skill } from './srs';

export type Scope = 'all' | 'studied' | 'custom';
export type Direction = Skill | 'mixed';

export interface QuizQuestion {
	char: string;
	skill: Skill;
}

export interface QuizAnswer extends QuizQuestion {
	chosen: string;
}

export function scopeChars(scope: Scope, cards: Cards, custom: string[]): string[] {
	const keep =
		scope === 'studied'
			? (c: string) => letterStatus(cards, c) !== 'unseen'
			: scope === 'custom'
				? (c: string) => custom.includes(c)
				: () => true;
	return ALPHABET.map((l) => l.char).filter(keep);
}

/** Length of a test the app picks for itself; a custom pick asks every letter the learner chose. */
export const AUTO_TEST_LENGTH = 20;

/**
 * Which letters a test asks. A custom pick is taken as it stands — choosing a letter is a request to
 * be tested on it. Otherwise the letters are drawn by mastery, so weak ones come up far more often
 * and a letter at 100 shows up about one time in twenty.
 */
export function pickChars(scope: Scope, chars: string[], mastery: Mastery, rng: Rng): string[] {
	if (scope === 'custom') return chars;
	return sampleByWeight(chars, mastery, Math.min(AUTO_TEST_LENGTH, chars.length), rng);
}

export function buildQuiz(chars: string[], direction: Direction, rng: Rng): QuizQuestion[] {
	const skills: Skill[] = chars.map((_, i) => (direction === 'mixed' ? (i % 2 ? 'read' : 'recall') : direction));
	const shuffledSkills = shuffle(skills, rng);
	return shuffle(chars, rng).map((char, i) => ({ char, skill: shuffledSkills[i] }));
}

export function summarize(answers: QuizAnswer[]) {
	const wrong = answers.filter((a) => a.chosen !== a.char);
	return { right: answers.length - wrong.length, total: answers.length, wrong };
}
