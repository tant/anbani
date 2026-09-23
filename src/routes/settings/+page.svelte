<script lang="ts">
	import Account from '$lib/components/Account.svelte';
	import FontPicker from '$lib/components/FontPicker.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import { LANGS, MAX_DISTRACTORS, MIN_DISTRACTORS, settings, t, updateSettings } from '$lib/settings.svelte';
</script>

<main class="page">
	<header class="bar">
		<h1>{t('settings')}</h1>
	</header>

	<section>
		<h2 id="lang-label">{t('language')}</h2>
		<Segmented name="lang" labelledby="lang-label" options={LANGS} value={settings.lang} onchange={(lang) => updateSettings({ lang })} />
	</section>

	<section>
		<h2 id="font-label">{t('glyphFont')}</h2>
		<FontPicker labelledby="font-label" />
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

	<Account />
</main>

<style>
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }

	.range { display: flex; align-items: center; gap: 16px; }
	.range input { flex: 1; min-height: 48px; accent-color: var(--lapis); }
	.range output { min-width: 7em; font-weight: 600; }
</style>
