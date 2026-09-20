import { load, save } from './storage';

/** Chrome fires this instead of showing its own bar, so the app decides when to ask. */
type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const DISMISSED_KEY = 'install-dismissed';

const standalone = () =>
	typeof matchMedia === 'function' &&
	(matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true);

/** Safari has no install event: iPhones and iPads need the Share menu, so they get instructions instead. */
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const install = $state({
	/** 'prompt' when the browser offered one, 'ios' when the learner has to use the Share menu. */
	how: null as 'prompt' | 'ios' | null,
	dismissed: false
});

let event: InstallEvent | null = null;

export function watchInstall() {
	install.dismissed = load(DISMISSED_KEY, false);
	if (standalone()) return;
	if (isIos()) install.how = 'ios';

	const onPrompt = (e: Event) => {
		e.preventDefault();
		event = e as InstallEvent;
		install.how = 'prompt';
	};
	const onInstalled = () => {
		install.how = null;
		event = null;
	};
	addEventListener('beforeinstallprompt', onPrompt);
	addEventListener('appinstalled', onInstalled);
	return () => {
		removeEventListener('beforeinstallprompt', onPrompt);
		removeEventListener('appinstalled', onInstalled);
	};
}

export async function askToInstall() {
	if (!event) return;
	await event.prompt();
	const { outcome } = await event.userChoice;
	event = null;
	if (outcome === 'accepted') install.how = null;
	else dismissInstall();
}

export function dismissInstall() {
	install.dismissed = true;
	save(DISMISSED_KEY, true);
}
