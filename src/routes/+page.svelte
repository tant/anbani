<script lang="ts">
	import AlphabetGrid from '$lib/components/AlphabetGrid.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import LetterSheet from '$lib/components/LetterSheet.svelte';
	import { ALPHABET, byChar, type Letter } from '$lib/letters';
	import { progress } from '$lib/progress.svelte';
	import { t } from '$lib/settings.svelte';
	import { dueCount, letterStatus, type LetterStatus } from '$lib/srs';

	const tone: Record<LetterStatus, string> = { unseen: 'muted', learning: 'lapis', known: 'ink' };

	const status = $derived(Object.fromEntries(ALPHABET.map((l) => [l.char, letterStatus(progress.cards, l.char)])) as Record<string, LetterStatus>);
	const known = $derived(Object.values(status).filter((s) => s === 'known').length);
	const learning = $derived(Object.values(status).filter((s) => s === 'learning').length);
	const due = $derived(dueCount(progress.cards, new Date()));
	const started = $derived(known + learning > 0);

	let selected = $state<Letter | null>(null);
</script>

<main class="page">
	<header class="top">
		<div>
			<h1 lang="ka">მხედრული</h1>
			<p class="muted"><span lang="en">Mkhedruli</span>. {t('tagline')}</p>
		</div>
		<a class="icon-btn" href="/settings" aria-label={t('settings')}><Icon name="settings" /></a>
	</header>

	<AlphabetGrid
		tone={(c) => tone[status[c]]}
		caption={(c) => (status[c] === 'unseen' ? '' : byChar.get(c)!.translit)}
		label={(c) => `${c}, ${t(status[c])}`}
		onpick={(c) => (selected = byChar.get(c)!)}
	/>

	<div class="legend">
		<ul>
			{#each ['unseen', 'learning', 'known'] as const as s (s)}
				<li><i style:background="var(--{tone[s]})"></i>{t(s)}</li>
			{/each}
		</ul>
		<p class="muted">{started ? t('summary', { known, learning }) : t('intro')}</p>
	</div>

	<footer class="cta">
		<div class="modes">
			<a class="btn primary" href="/test">{t('test')}</a>
			<a class="btn" href="/learn">
				{started ? t('continue') : t('start')}
				{#if due}<span class="badge" aria-label={t('dueCount', { n: due })}>{due}</span>{/if}
			</a>
		</div>
	</footer>
</main>

<LetterSheet letter={selected} onclose={() => (selected = null)} />

<style>
	.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
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

	.cta {
		position: sticky;
		bottom: 0;
		margin-top: auto;
		padding: 12px 0 max(4px, env(safe-area-inset-bottom));
		background: var(--paper);
		display: flex;
		flex-direction: column;
		gap: 6px;
		text-align: center;
	}
	.modes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.badge {
		min-width: 1.6em;
		margin-left: 8px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--lapis);
		color: var(--on-lapis);
		font-size: 0.8rem;
		line-height: 1.6;
	}
</style>
