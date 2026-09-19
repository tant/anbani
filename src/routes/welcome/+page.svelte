<script lang="ts">
	import { goto } from '$app/navigation';
	import FontPicker from '$lib/components/FontPicker.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import Staff from '$lib/components/Staff.svelte';
	import { ONBOARDED_KEY } from '$lib/onboarding';
	import { LANGS, settings, t, updateSettings } from '$lib/settings.svelte';
	import { save } from '$lib/storage';

	function begin(path: string) {
		save(ONBOARDED_KEY, true);
		goto(path, { replaceState: true });
	}
</script>

<main class="page">
	<section class="hero">
		<Staff char="ა" size="min(8.5rem, 34vw)" tone="lapis" write />
		<h1 lang="ka">მხედრული</h1>
		<p class="muted">{t('welcomeTagline')}</p>
	</section>

	<section>
		<h2 id="lang-label">{t('language')}</h2>
		<Segmented name="lang" labelledby="lang-label" options={LANGS} value={settings.lang} onchange={(lang) => updateSettings({ lang })} />
	</section>

	<section>
		<h2 id="font-label">{t('glyphFont')}</h2>
		<FontPicker labelledby="font-label" />
		<p class="muted">{t('fontHelp')}</p>
	</section>

	<div class="actions bottom">
		<button class="btn primary" onclick={() => begin('/learn')}>{t('startNew')}</button>
		<button class="btn" onclick={() => begin('/test?scope=all')}>{t('startKnown')}</button>
	</div>
</main>

<style>
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }
	.hero { align-items: stretch; text-align: center; gap: 6px; padding-top: 12px; }
	.hero h1 { font-family: var(--font-glyph); font-size: clamp(2.2rem, 10vw, 2.8rem); font-weight: 600; line-height: 1.2; }
</style>
