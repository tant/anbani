<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authError } from '$lib/authError';
	import { finishGoogleSignIn } from '$lib/google';
	import { pull } from '$lib/progress.svelte';
	import { adoptProfile, t } from '$lib/settings.svelte';

	let error = $state('');

	onMount(async () => {
		try {
			const { record, from } = await finishGoogleSignIn(new URLSearchParams(location.search));
			await adoptProfile(record);
			await pull();
			await goto(from, { replaceState: true });
		} catch (err) {
			error = t(authError(err, navigator.onLine));
		}
	});
</script>

<main class="page center">
	{#if error}
		<p class="error" role="alert">{error}</p>
		<a class="btn" href="/settings">{t('settings')}</a>
	{:else}
		<p class="muted">{t('signingIn')}</p>
	{/if}
</main>

<style>
	.center { align-items: center; justify-content: center; gap: 18px; text-align: center; }
	.error { color: var(--bad); max-width: 40ch; }
</style>
