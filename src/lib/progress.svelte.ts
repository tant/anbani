import { INITIAL, KNOWN_AT, scoreAfter, type Mastery } from './mastery';
import { pb } from './pb';
import { cardKey, gradeAnswer, isNewer, letterStatus, newCard, parseKey, reviewCard, reviveCard, SKILLS, type Cards, type Skill } from './srs';
import { load, save } from './storage';

type Confusions = Record<string, Record<string, number>>;

const revive = (raw: Cards): Cards => Object.fromEntries(Object.entries(raw).map(([k, c]) => [k, reviveCard(c)]));

export const progress = $state({
	cards: revive(load<Cards>('cards', {})),
	confusions: load<Confusions>('confusions', {}),
	/** How well each letter is known, 0 to 100; see mastery.ts. */
	mastery: load<Mastery>('mastery', {})
});

/** Progress from before scores existed: start each letter off from what its review cards say. */
for (const key of Object.keys(progress.cards)) {
	const { item } = parseKey(key);
	progress.mastery[item] ??= letterStatus(progress.cards, item) === 'known' ? KNOWN_AT + 5 : INITIAL;
}

/** Keys changed on this device and not yet stored in PocketBase. */
const dirty = new Set<string>(load<string[]>('dirty', []));
let remoteIds = load<Record<string, string>>('remoteIds', {});
let pushing = false;

/** What Settings shows about syncing: waiting cards, when the last push landed, work in flight. */
export const sync = $state({
	pending: dirty.size,
	at: load<number | null>('syncedAt', null),
	busy: false
});

function persist() {
	save('cards', progress.cards);
	save('confusions', progress.confusions);
	save('mastery', progress.mastery);
	save('dirty', [...dirty]);
	save('remoteIds', remoteIds);
	sync.pending = dirty.size;
}

export function introduce(char: string, now = new Date()) {
	for (const skill of SKILLS) {
		const key = cardKey(skill, char);
		if (progress.cards[key]) continue;
		progress.cards[key] = newCard(now);
		dirty.add(key);
	}
	progress.mastery[char] ??= INITIAL;
	persist();
	void push();
}

export function answer(skill: Skill, char: string, chosen: string, ms: number, now = new Date()): boolean {
	const key = cardKey(skill, char);
	const correct = chosen === char;
	progress.cards[key] = reviewCard(progress.cards[key], gradeAnswer(correct, ms), now);
	if (!correct) {
		const row = (progress.confusions[char] ??= {});
		row[chosen] = (row[chosen] ?? 0) + 1;
	}
	progress.mastery[char] = scoreAfter(progress.mastery[char] ?? INITIAL, correct, ms);
	dirty.add(key);
	persist();
	void push();
	return correct;
}

/**
 * A test answer moves the mastery score but never the review schedule: the learner checks themselves
 * without dragging the next review closer or further away.
 */
export function score(char: string, correct: boolean, ms: number) {
	progress.mastery[char] = scoreAfter(progress.mastery[char] ?? INITIAL, correct, ms);
	for (const skill of SKILLS) if (progress.cards[cardKey(skill, char)]) dirty.add(cardKey(skill, char));
	persist();
	void push();
}

export async function push() {
	const user = pb.authStore.record;
	if (!user || pushing || !navigator.onLine) return;
	pushing = true;
	sync.busy = true;
	try {
		for (const key of [...dirty]) {
			const card = progress.cards[key];
			const { item } = parseKey(key);
			const data = { user: user.id, key, card, due: card.due, score: progress.mastery[item] ?? INITIAL };
			if (remoteIds[key]) await pb.collection('reviews').update(remoteIds[key], data);
			else remoteIds[key] = (await pb.collection('reviews').create(data)).id;
			dirty.delete(key);
		}
	} catch {
		// remaining keys stay dirty; retried on the next answer or when the device is back online
	} finally {
		pushing = false;
		sync.busy = false;
		if (!dirty.size) {
			sync.at = Date.now();
			save('syncedAt', sync.at);
		}
		persist();
	}
}

/** Merge the account's cards into this device, keeping whichever copy saw more practice. */
export async function pull() {
	if (!pb.authStore.record) return;
	const records = await pb.collection('reviews').getFullList({ fields: 'id,key,card,score' });
	remoteIds = {};
	for (const r of records) {
		remoteIds[r.key] = r.id;
		const remote = reviveCard(r.card);
		const local = progress.cards[r.key];
		if (!local || isNewer(remote, local)) {
			progress.cards[r.key] = remote;
			progress.mastery[parseKey(r.key).item] = r.score ?? INITIAL;
			dirty.delete(r.key);
		} else if (isNewer(local, remote)) dirty.add(r.key);
	}
	for (const key of Object.keys(progress.cards)) if (!remoteIds[key]) dirty.add(key);
	persist();
	await push();
}

/** After sign-out the device keeps its progress; all of it is offered to the next account. */
export function forgetRemote() {
	remoteIds = {};
	for (const key of Object.keys(progress.cards)) dirty.add(key);
	persist();
}
