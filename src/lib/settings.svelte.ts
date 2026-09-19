import type { RecordModel } from 'pocketbase';
import { translate, type Params } from './i18n';
import type { Lang } from './letters';
import type { MessageKey } from './messages';
import { pb } from './pb';
import { load, save } from './storage';

export const MIN_DISTRACTORS = 2;
export const MAX_DISTRACTORS = 5;

export interface Settings {
	lang: Lang;
	distractors: number;
}

const detectLang = (): Lang => (navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en');

export const settings = $state<Settings>(load('settings', { lang: detectLang(), distractors: 3 }));

export function updateSettings(patch: Partial<Settings>) {
	Object.assign(settings, patch);
	save('settings', settings);
	const user = pb.authStore.record;
	// ponytail: fire-and-forget; an offline change is replaced by the profile at the next sign-in
	if (user) pb.collection('users').update(user.id, patch).catch(() => {});
}

/** On sign-in the stored profile wins; an empty profile takes this device's settings. */
export async function adoptProfile(user: RecordModel) {
	if (user.lang && user.distractors) {
		Object.assign(settings, { lang: user.lang, distractors: user.distractors });
		save('settings', settings);
	} else {
		await pb.collection('users').update(user.id, { lang: settings.lang, distractors: settings.distractors });
	}
}

export const t = (key: MessageKey, params?: Params) => translate(settings.lang, key, params);
