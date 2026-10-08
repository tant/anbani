<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { dur, ease } from '$lib/motion';
	import { pb } from '$lib/pb';
	import { byType, CATALOGUE, ITEM_TYPES, recordedCount, TAKES, type ItemType } from '$lib/recording';
	import { settings } from '$lib/settings.svelte';
	import { fly } from 'svelte/transition';

	// The reader is a native speaker who does not read Vietnamese: this screen stays Georgian + English.
	const LABELS: Record<ItemType, { ka: string; en: string }> = {
		letter: { ka: 'ასოები', en: 'Letters' },
		cluster: { ka: 'თანხმოვანთა ჯგუფები', en: 'Consonant clusters' },
		word: { ka: 'სიტყვები', en: 'Words' },
		phrase: { ka: 'ფრაზები', en: 'Phrases' }
	};

	let done = $state(new Set<string>());
	let loading = $state(true);
	let failed = $state(false);
	let filter = $state<ItemType | 'all'>('all');

	onMount(async () => {
		try {
			const rows = await pb.collection('recordings').getFullList({ fields: 'item,audio', requestKey: null });
			// An item counts as recorded once all three takes are in.
			done = new Set(rows.filter((r) => (r.audio as string[])?.length >= TAKES).map((r) => r.item as string));
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});

	const total = $derived(recordedCount(done));
	const shown = $derived(filter === 'all' ? CATALOGUE : byType(filter));
</script>

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label="Back"><Icon name="back" /></a>
		<h1>ჩაწერა <span class="muted">Recording</span></h1>
	</header>

	{#if loading}
		<p class="muted">იტვირთება… Loading…</p>
	{:else if failed}
		<p class="muted">ჩანაწერების სია ვერ ჩაიტვირთა. Could not load the recordings.</p>
	{:else}
		<section class="summary">
			<p class="count">{total.done}<span>/{total.total}</span></p>
			<div class="bar-track"><i style:width="{(total.done / total.total) * 100}%"></i></div>
			<p class="muted">ჩაწერილია / recorded</p>
		</section>

		<div class="filters" role="group" aria-label="Filter">
			<button class="chip" class:on={filter === 'all'} onclick={() => (filter = 'all')}>ყველა · All</button>
			{#each ITEM_TYPES as type (type)}
				{@const c = recordedCount(done, type)}
				<button class="chip" class:on={filter === type} onclick={() => (filter = type)}>
					{LABELS[type].ka} <span class="muted">{c.done}/{c.total}</span>
				</button>
			{/each}
		</div>

		<ul class="items">
			{#each shown as item, i (item.id)}
				<li class:recorded={done.has(item.id)} in:fly={{ y: 10, duration: dur(200), delay: dur(Math.min(i, 12) * 20), easing: ease }}>
					<span class="glyph" lang="ka">{item.text}</span>
					<span class="about">
						<span class="translit">{item.translit}</span>
						{#if item.example}<span class="muted" lang="ka">{item.example}</span>{/if}
						{#if item.meaning}<span class="muted">{item.meaning[settings.lang]}</span>{/if}
					</span>
					<span class="mark" aria-label={done.has(item.id) ? 'recorded' : 'not recorded'}>{done.has(item.id) ? '●' : '○'}</span>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	h1 { font-size: 1.2rem; font-weight: 600; }
	h1 .muted { font-weight: 400; font-size: 0.9rem; }

	.summary { display: flex; flex-direction: column; gap: 8px; }
	.count { font-size: 2.6rem; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
	.count span { font-size: 1.2rem; color: var(--muted); }
	.bar-track { height: 8px; border-radius: 4px; background: var(--rule); overflow: hidden; }
	.bar-track i { display: block; height: 100%; background: var(--lapis); transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }

	.filters { display: flex; flex-wrap: wrap; gap: 8px; }
	.chip {
		min-height: 40px;
		padding: 0 14px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		font-size: 0.9rem;
		cursor: pointer;
	}
	.chip.on { background: var(--lapis); border-color: var(--lapis); color: var(--on-lapis); }
	.chip.on .muted { color: inherit; opacity: 0.8; }

	.items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
	.items li {
		display: grid;
		grid-template-columns: minmax(3.5rem, auto) 1fr auto;
		align-items: center;
		gap: 14px;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--tile);
	}
	.items li.recorded .mark { color: var(--ok); }
	.glyph { font-family: var(--font-glyph); font-size: 1.5rem; }
	.about { display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; }
	.translit { font-weight: 500; }
	.mark { color: var(--rule-strong); font-size: 1.1rem; }
</style>
