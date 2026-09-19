<script lang="ts">
	import Segmented from '$lib/components/Segmented.svelte';
	import type { Lang } from '$lib/letters';
	import { pb } from '$lib/pb';
	import { forgetRemote, pull } from '$lib/progress.svelte';
	import { adoptProfile, MAX_DISTRACTORS, MIN_DISTRACTORS, settings, t, updateSettings } from '$lib/settings.svelte';

	const langs: { value: Lang; label: string }[] = [
		{ value: 'vi', label: 'Tiếng Việt' },
		{ value: 'en', label: 'English' }
	];

	let user = $state(pb.authStore.record);
	$effect(() => pb.authStore.onChange(() => (user = pb.authStore.record)));

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function signIn(create: boolean) {
		busy = true;
		error = '';
		try {
			const users = pb.collection('users');
			if (create) {
				await users.create({ email, password, passwordConfirm: password, lang: settings.lang, distractors: settings.distractors });
			}
			const { record } = await users.authWithPassword(email, password);
			await adoptProfile(record);
			await pull();
			password = '';
		} catch {
			error = t(create ? 'signUpFailed' : 'signInFailed');
		} finally {
			busy = false;
		}
	}

	function signOut() {
		pb.authStore.clear();
		forgetRemote();
	}
</script>

<main class="page">
	<header class="bar">
		<h1>{t('settings')}</h1>
	</header>

	<section>
		<h2 id="lang-label">{t('language')}</h2>
		<Segmented name="lang" labelledby="lang-label" options={langs} value={settings.lang} onchange={(lang) => updateSettings({ lang })} />
	</section>

	<section>
		<h2><label for="choices">{t('choices')}</label></h2>
		<div class="range">
			<input
				id="choices"
				type="range"
				min={MIN_DISTRACTORS}
				max={MAX_DISTRACTORS}
				step="1"
				value={settings.distractors}
				oninput={(e) => (settings.distractors = Number(e.currentTarget.value))}
				onchange={() => updateSettings({ distractors: settings.distractors })}
			/>
			<output for="choices">{t('choicesValue', { n: settings.distractors + 1 })}</output>
		</div>
		<p class="muted">{t('choicesHelp')}</p>
	</section>

	<section>
		<h2>{t('account')}</h2>
		{#if user}
			<p>{t('signedInAs', { email: user.email })}</p>
			<button class="btn" onclick={signOut}>{t('signOut')}</button>
		{:else}
			<p class="muted">{t('accountHelp')}</p>
			<form onsubmit={(e) => { e.preventDefault(); signIn(false); }}>
				<label>{t('email')}<input type="email" autocomplete="email" required bind:value={email} /></label>
				<label>{t('password')}<input type="password" autocomplete="current-password" minlength="8" required bind:value={password} /></label>
				{#if error}<p class="error" role="alert">{error}</p>{/if}
				<div class="row">
					<button class="btn primary" disabled={busy}>{t('signIn')}</button>
					<button class="btn" type="button" disabled={busy} onclick={(e) => e.currentTarget.form?.reportValidity() && signIn(true)}>{t('signUp')}</button>
				</div>
			</form>
		{/if}
	</section>
</main>

<style>
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }


	.range { display: flex; align-items: center; gap: 16px; }
	.range input { flex: 1; min-height: 48px; accent-color: var(--lapis); }
	.range output { min-width: 7em; font-weight: 600; }

	form { display: flex; flex-direction: column; gap: 12px; }
	form label { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
	form input {
		min-height: 48px;
		padding: 0 14px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 10px;
		background: var(--tile);
		font-size: 1rem;
	}
	.row { display: flex; flex-wrap: wrap; gap: 10px; }
	.error { color: var(--bad); }
</style>
