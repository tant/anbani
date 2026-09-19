import type { Lang } from './letters';
import { messages, type MessageKey } from './messages';

export type Params = Record<string, string | number>;

export const format = (template: string, params: Params = {}) =>
	template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));

export const translate = (lang: Lang, key: MessageKey, params?: Params) => format(messages[lang][key], params);

export function relativeTime(date: Date, now: Date, lang: Lang): string {
	const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
	const minutes = Math.round((+date - +now) / 60_000);
	if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
	return rtf.format(Math.round(hours / 24), 'day');
}
