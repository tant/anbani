import type { RecordModel } from 'pocketbase';
import { translate, type Params } from './i18n';
import type { Lang } from './letters';
import type { MessageKey } from './messages';
import { pb } from './pb';
import { load, save } from './storage';

export const MIN_DISTRACTORS = 2;
export const MAX_DISTRACTORS = 5;

/** Georgian letter style: learners pick the one closest to their book. */
export type GlyphFont = 'sans' | 'serif' | 'system';
export const GLYPH_FONTS: GlyphFont[] = ['sans', 'serif', 'system'];

export interface Settings {
	lang: Lang;
	distractors: number;
	glyphFont: GlyphFont;
}

const detectLang = (): Lang => (navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en');

// Stored settings from older versions lack newer keys; defaults fill them in.
export const settings = $state<Settings>({
	lang: detectLang(),
	distractors: 3,
	glyphFont: 'sans',
	...load<Partial<Settings>>('settings', {})
});

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
		Object.assign(settings, { lang: user.lang, distractors: user.distractors, glyphFont: user.glyphFont || settings.glyphFont });
		save('settings', settings);
		if (!user.glyphFont) await pb.collection('users').update(user.id, { glyphFont: settings.glyphFont });
	} else {
		await pb.collection('users').update(user.id, { ...settings });
	}
}

export const t = (key: MessageKey, params?: Params) => translate(settings.lang, key, params);
