<script lang="ts">
	import { onMount } from 'svelte';
	import { authError } from '$lib/authError';
	import { startGoogleSignIn } from '$lib/google';
	import { relativeTime } from '$lib/i18n';
	import { pb } from '$lib/pb';
	import { forgetRemote, push, sync } from '$lib/progress.svelte';
	import { settings, t } from '$lib/settings.svelte';

	let user = $state(pb.authStore.record);
	$effect(() => pb.authStore.onChange(() => (user = pb.authStore.record)));

	let error = $state('');
	let busy = $state(false);

	let online = $state(true);
	// Relative times go stale while the page sits open on the Settings tab.
	let now = $state(Date.now());
	onMount(() => {
		online = navigator.onLine;
		const mark = () => (online = navigator.onLine);
		addEventListener('online', mark);
		addEventListener('offline', mark);
		const tick = setInterval(() => (now = Date.now()), 30_000);
		return () => {
			removeEventListener('online', mark);
			removeEventListener('offline', mark);
			clearInterval(tick);
		};
	});

	const status = $derived(
		!online ? t('syncOffline') : sync.busy ? t('syncBusy') : sync.pending ? t('syncPending', { n: sync.pending }) : sync.at ? t('syncedAt', { time: relativeTime(new Date(sync.at), new Date(now), settings.lang) }) : t('syncNever')
	);

	async function signIn() {
		error = '';
		busy = true;
		try {
			await startGoogleSignIn();
		} catch (err) {
			error = t(authError(err, navigator.onLine));
			busy = false;
		}
	}

	function signOut() {
		pb.authStore.clear();
		forgetRemote();
	}
</script>

<section>
	<h2>{t('account')}</h2>

	{#if user}
		<p>{t('signedInAs', { email: user.email })}</p>
		<div class="sync">
			<p class:waiting={!online || sync.pending}>{status}</p>
			<button class="btn" onclick={() => void push()} disabled={sync.busy || !online || !sync.pending}>{t('syncNow')}</button>
		</div>
		<button class="btn" onclick={signOut}>{t('signOut')}</button>
	{:else}
		<p class="muted">{t('accountHelp')}</p>
		<button class="btn primary google" onclick={signIn} disabled={busy}>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path fill="#ffffff" d="M21.6 12.2c0-.7-.06-1.4-.18-2.04H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.74 2.98-4.3 2.98-7.35z" />
				<path fill="#ffffff" d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.6-4.1H3.06v2.58A10 10 0 0 0 12 22z" />
				<path fill="#ffffff" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.5H3.06a10 10 0 0 0 0 9z" />
				<path fill="#ffffff" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.94 5.5L6.4 10.1c.8-2.36 3-4.11 5.6-4.11z" />
			</svg>
			{busy ? t('signingIn') : t('continueWithGoogle')}
		</button>
		{#key error}{#if error}<p class="error" role="alert">{error}</p>{/if}{/key}
	{/if}
</section>

<style>
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }

	.sync { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; justify-content: space-between; }
	.sync p { font-size: 0.9rem; color: var(--muted); }
	.sync p.waiting { color: var(--ink); }

	.google { gap: 10px; }

	.error { color: var(--bad); animation: shake 0.36s ease-in-out; }
	@keyframes shake {
		20%, 60% { transform: translateX(-5px); }
		40%, 80% { transform: translateX(5px); }
	}
</style>
