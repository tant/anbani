<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Listen from '$lib/components/Listen.svelte';
	import type { MessageKey } from '$lib/messages';
	import { byType, ITEM_TYPES, type ItemType } from '$lib/recording';
	import { settings, t } from '$lib/settings.svelte';
	import { hasVoice } from '$lib/voices.svelte';

	const HEADING: Record<ItemType, MessageKey> = {
		letter: 'typeLetters',
		cluster: 'typeClusters',
		word: 'typeWords',
		phrase: 'typePhrases'
	};

	// Only what a native speaker has already read: a section with nothing to play is left out.
	const groups = $derived(
		ITEM_TYPES.map((type) => ({ type, items: byType(type).filter((item) => hasVoice(item.id)) })).filter((g) => g.items.length)
	);
</script>

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label={t('close')}><Icon name="back" /></a>
		<h1>{t('listenTitle')}</h1>
	</header>

	{#if !groups.length}
		<p class="muted">{t('listenEmpty')}</p>
	{:else}
		<p class="muted">{t('listenHint')}</p>
		{#each groups as group (group.type)}
			<section>
				<h2>{t(HEADING[group.type])}</h2>
				<ul>
					{#each group.items as item (item.id)}
						<li>
							<span class="glyph" lang="ka">{item.text}</span>
							<span class="about">
								<span class="translit">{item.translit}</span>
								{#if item.meaning}<span class="muted">{item.meaning[settings.lang]}</span>{/if}
							</span>
							<Listen item={item.id} size="sm" />
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</main>

<style>
	h1 { font-size: 1.2rem; font-weight: 600; }
	h2 { font-size: 1rem; font-weight: 600; margin-bottom: 8px; }

	ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
	li {
		display: grid;
		grid-template-columns: minmax(3.5rem, auto) 1fr auto;
		align-items: center;
		gap: 14px;
		padding: 8px 12px;
		border-radius: 10px;
		background: var(--tile);
	}
	.glyph { font-family: var(--font-glyph); font-size: 1.5rem; }
	.about { display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; }
	.translit { font-weight: 500; }
</style>
