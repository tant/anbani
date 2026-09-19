import { ALPHABET } from './letters';
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

export function buildQuiz(chars: string[], direction: Direction, rng: Rng): QuizQuestion[] {
	const skills: Skill[] = chars.map((_, i) => (direction === 'mixed' ? (i % 2 ? 'read' : 'recall') : direction));
	const shuffledSkills = shuffle(skills, rng);
	return shuffle(chars, rng).map((char, i) => ({ char, skill: shuffledSkills[i] }));
}

export function summarize(answers: QuizAnswer[]) {
	const wrong = answers.filter((a) => a.chosen !== a.char);
	return { right: answers.length - wrong.length, total: answers.length, wrong };
}
