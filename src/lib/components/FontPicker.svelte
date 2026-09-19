<script lang="ts">
	import { GLYPH_FONTS, settings, t, updateSettings } from '$lib/settings.svelte';

	let { labelledby }: { labelledby: string } = $props();

	const label = { sans: 'fontSans', serif: 'fontSerif', pen: 'fontPen', round: 'fontRound', system: 'fontSystem' } as const;
</script>

<div class="fonts" role="radiogroup" aria-labelledby={labelledby}>
	{#each GLYPH_FONTS as font (font)}
		<label class="font" class:on={settings.glyphFont === font}>
			<input type="radio" name="glyphFont" value={font} checked={settings.glyphFont === font} onchange={() => updateSettings({ glyphFont: font })} />
			<span class="sample {font}" lang="ka" aria-hidden="true">ქარ</span>
			<span>{t(label[font])}</span>
		</label>
	{/each}
</div>

<style>
	.fonts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
	@media (min-width: 520px) {
		.fonts { grid-template-columns: repeat(5, minmax(0, 1fr)); }
	}
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
	.sample { display: grid; place-items: center; height: 3.2rem; font-size: 2rem; line-height: 1; font-weight: 400; }
	.sample.sans { font-family: var(--font-glyph-sans); }
	.sample.serif { font-family: 'BPG Serif Modern'; }
	.sample.pen { font-family: 'BPG Mikhail Stephan'; }
	.sample.round { font-family: 'BPG Glaho'; }
	.sample.system { font-family: var(--font-glyph-system); }
</style>
