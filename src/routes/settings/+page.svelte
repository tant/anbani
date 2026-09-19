<script lang="ts">
	import Segmented from '$lib/components/Segmented.svelte';
	import type { Lang } from '$lib/letters';
	import { pb } from '$lib/pb';
	import { forgetRemote, pull } from '$lib/progress.svelte';
	import { adoptProfile, GLYPH_FONTS, MAX_DISTRACTORS, MIN_DISTRACTORS, settings, t, updateSettings } from '$lib/settings.svelte';

	const fontLabel = { sans: 'fontSans', serif: 'fontSerif', system: 'fontSystem' } as const;

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
				await users.create({ email, password, passwordConfirm: password, ...settings });
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
		<h2 id="font-label">{t('glyphFont')}</h2>
		<div class="fonts" role="radiogroup" aria-labelledby="font-label">
			{#each GLYPH_FONTS as font (font)}
				<label class="font" class:on={settings.glyphFont === font}>
					<input type="radio" name="glyphFont" value={font} checked={settings.glyphFont === font} onchange={() => updateSettings({ glyphFont: font })} />
					<span class="sample {font}" lang="ka" aria-hidden="true">აბგდ</span>
					<span>{t(fontLabel[font])}</span>
				</label>
			{/each}
		</div>
		<p class="muted">{t('fontHelp')}</p>
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

	.fonts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
	.font {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px 6px 10px;
		border: 1.5px solid var(--rule-strong);
		border-radius: var(--radius);
		font-size: 0.85rem;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.2s, background-color 0.2s;
	}
	.font.on { border-color: var(--lapis); background: color-mix(in srgb, var(--lapis) 12%, transparent); font-weight: 600; }
	.font:has(input:focus-visible) { outline: 3px solid var(--lapis); outline-offset: 2px; }
	.font input { position: absolute; opacity: 0; pointer-events: none; }
	.sample { font-size: 1.7rem; line-height: 1.4; font-weight: 400; }
	.sample.sans { font-family: var(--font-glyph-sans); }
	.sample.serif { font-family: var(--font-glyph-serif); }
	.sample.system { font-family: var(--font-glyph-system); }

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
