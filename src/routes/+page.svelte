<script lang="ts" module>
	let filled = false;
</script>

<script lang="ts">
	import AlphabetGrid from '$lib/components/AlphabetGrid.svelte';
	import InstallCard from '$lib/components/InstallCard.svelte';
	import LetterSheet from '$lib/components/LetterSheet.svelte';
	import { ALPHABET, byChar, type Letter } from '$lib/letters';
	import { progress } from '$lib/progress.svelte';
	import { t } from '$lib/settings.svelte';
	import { letterStatus, type LetterStatus } from '$lib/srs';

	const tone: Record<LetterStatus, string> = { unseen: 'muted', learning: 'lapis', known: 'ink' };

	const status = $derived(Object.fromEntries(ALPHABET.map((l) => [l.char, letterStatus(progress.cards, l.char)])) as Record<string, LetterStatus>);
	const known = $derived(Object.values(status).filter((s) => s === 'known').length);
	const learning = $derived(Object.values(status).filter((s) => s === 'learning').length);
	const started = $derived(known + learning > 0);

	let selected = $state<Letter | null>(null);
	const fill = !filled;
	filled = true;
</script>

<main class="page">
	<header>
		<div>
			<h1 lang="ka">ანბანი</h1>
			<p class="muted"><span lang="en">Anbani</span>. {t('tagline')}</p>
		</div>
	</header>

	<AlphabetGrid
		tone={(c) => tone[status[c]]}
		caption={(c) => (status[c] === 'unseen' ? '' : byChar.get(c)!.translit)}
		label={(c) => `${c}, ${t(status[c])}`}
		onpick={(c) => (selected = byChar.get(c)!)}
		{fill}
	/>

	<div class="legend">
		<ul>
			{#each ['unseen', 'learning', 'known'] as const as s (s)}
				<li><i style:background="var(--{tone[s]})"></i>{t(s)}</li>
			{/each}
		</ul>
		<p class="muted">{started ? t('summary', { known, learning }) : t('intro')}</p>
	</div>

	<InstallCard />
</main>

<LetterSheet letter={selected} onclose={() => (selected = null)} />

<style>
	h1 {
		font-family: var(--font-glyph);
		font-size: clamp(2.2rem, 9vw, 3rem);
		font-weight: 600;
		line-height: 1.2;
	}

	.legend { display: flex; flex-direction: column; gap: 8px; }
	.legend ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.9rem; }
	.legend li { display: flex; align-items: center; gap: 8px; }
	.legend i { width: 10px; height: 10px; border-radius: 50%; }

</style>
