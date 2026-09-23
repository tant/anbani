<script lang="ts">
	import { onMount } from 'svelte';
	import { authError } from '$lib/authError';
	import { relativeTime } from '$lib/i18n';
	import { dur, ease } from '$lib/motion';
	import { pb } from '$lib/pb';
	import { forgetRemote, pull, push, sync } from '$lib/progress.svelte';
	import { adoptProfile, settings, t } from '$lib/settings.svelte';
	import { slide } from 'svelte/transition';
	import Segmented from './Segmented.svelte';

	let user = $state(pb.authStore.record);
	$effect(() => pb.authStore.onChange(() => (user = pb.authStore.record)));

	type Mode = 'in' | 'up';
	let mode = $state<Mode>('in');
	let email = $state('');
	let password = $state('');
	let again = $state('');
	let reveal = $state(false);
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

	async function submit() {
		error = '';
		if (mode === 'up' && password !== again) {
			error = t('passwordMismatch');
			return;
		}
		busy = true;
		try {
			const users = pb.collection('users');
			if (mode === 'up') await users.create({ email, password, passwordConfirm: password, ...settings });
			const { record } = await users.authWithPassword(email, password);
			await adoptProfile(record);
			await pull();
			password = again = '';
		} catch (err) {
			error = t(authError(err, mode, navigator.onLine));
		} finally {
			busy = false;
		}
	}

	function signOut() {
		pb.authStore.clear();
		forgetRemote();
	}
</script>

<section>
	<h2 id="account-label">{t('account')}</h2>

	{#if user}
		<p>{t('signedInAs', { email: user.email })}</p>
		<div class="sync">
			<p class:waiting={!online || sync.pending}>{status}</p>
			<button class="btn" onclick={() => void push()} disabled={sync.busy || !online || !sync.pending}>{t('syncNow')}</button>
		</div>
		<button class="btn" onclick={signOut}>{t('signOut')}</button>
	{:else}
		<p class="muted">{t('accountHelp')}</p>
		<Segmented
			name="account-mode"
			labelledby="account-label"
			options={[
				{ value: 'up' as Mode, label: t('newAccount') },
				{ value: 'in' as Mode, label: t('haveAccount') }
			]}
			value={mode}
			onchange={(m) => {
				mode = m;
				error = '';
			}}
		/>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			<label>
				{t('email')}
				<input type="email" autocomplete="email" required bind:value={email} />
			</label>

			<label>
				{t('password')}
				<span class="reveal">
					<input
						type={reveal ? 'text' : 'password'}
						autocomplete={mode === 'up' ? 'new-password' : 'current-password'}
						minlength="8"
						required
						bind:value={password}
					/>
					<button type="button" onclick={() => (reveal = !reveal)}>{reveal ? t('hidePassword') : t('showPassword')}</button>
				</span>
			</label>

			{#if mode === 'up'}
				<label transition:slide={{ duration: dur(260), easing: ease }}>
					{t('passwordAgain')}
					<input type={reveal ? 'text' : 'password'} autocomplete="new-password" minlength="8" required bind:value={again} />
				</label>
			{/if}

			{#key error}{#if error}<p class="error" role="alert">{error}</p>{/if}{/key}

			<button class="btn primary" disabled={busy}>{mode === 'up' ? t('signUp') : t('signIn')}</button>
		</form>
	{/if}
</section>

<style>
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }

	.sync { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; justify-content: space-between; }
	.sync p { font-size: 0.9rem; color: var(--muted); }
	.sync p.waiting { color: var(--ink); }

	form { display: flex; flex-direction: column; gap: 12px; }
	form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
	form input {
		width: 100%;
		min-height: 48px;
		padding: 0 14px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 10px;
		background: var(--tile);
		font-size: 1rem;
	}

	.reveal { position: relative; display: block; }
	.reveal button {
		position: absolute;
		inset-inline-end: 6px;
		top: 50%;
		transform: translateY(-50%);
		min-height: 36px;
		padding: 0 10px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--lapis);
		font-size: 0.85rem;
		cursor: pointer;
	}

	.error { color: var(--bad); animation: shake 0.36s ease-in-out; }
	@keyframes shake {
		20%, 60% { transform: translateX(-5px); }
		40%, 80% { transform: translateX(5px); }
	}
</style>
