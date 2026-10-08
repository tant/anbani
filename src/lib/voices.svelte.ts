import { pb } from './pb';
import { load, save } from './storage';

/** Catalogue item id (see recording.ts) to the URLs of its approved takes. */
export type Takes = Record<string, string[]>;

/**
 * Pronunciation recorded by a native speaker. Only approved rows ever reach a learner, and the URLs
 * are remembered on the device so an offline start still knows what there is to play; the service
 * worker keeps the audio files themselves.
 */
export const voices = $state<{ takes: Takes }>({ takes: load<Takes>('voices', {}) });

const turn = new Map<string, number>();

/** Which take to play next, so hearing a letter twice does not replay the same clip. */
export function nextTake(item: string, urls: string[]) {
	const i = ((turn.get(item) ?? -1) + 1) % urls.length;
	turn.set(item, i);
	return urls[i];
}

export const hasVoice = (item: string) => voices.takes[item]?.length > 0;

let sound: HTMLAudioElement | undefined;

export function playVoice(item: string) {
	const urls = voices.takes[item];
	if (!urls?.length) return;
	sound?.pause();
	sound = new Audio(nextTake(item, urls));
	// Nothing to do if playback is refused: the learner can tap again.
	void sound.play().catch(() => {});
}

export async function loadVoices() {
	const rows = await pb
		.collection('recordings')
		.getFullList({ filter: 'status = "approved"', fields: 'id,collectionId,item,audio', requestKey: null });
	const takes: Takes = {};
	for (const row of rows) {
		const urls = ((row.audio as string[]) ?? []).map((name) => pb.files.getURL(row, name));
		if (urls.length) takes[row.item as string] = urls;
	}
	voices.takes = takes;
	save('voices', takes);
}
