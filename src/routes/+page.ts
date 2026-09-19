import { redirect } from '@sveltejs/kit';
import { ONBOARDED_KEY, shouldWelcome } from '$lib/onboarding';
import { progress } from '$lib/progress.svelte';
import { load as read } from '$lib/storage';

export function load() {
	if (shouldWelcome(read(ONBOARDED_KEY, false), Object.keys(progress.cards).length)) redirect(307, '/welcome');
}
