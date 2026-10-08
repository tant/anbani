<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Recorder from '$lib/components/Recorder.svelte';
	import { releaseMic } from '$lib/mic';
	import { dur, ease } from '$lib/motion';
	import { pb } from '$lib/pb';
	import { byType, CATALOGUE, ITEM_TYPES, nextUnrecorded, recordedCount, TAKES, type Item, type ItemType } from '$lib/recording';
	import { ui } from '$lib/ui.svelte';
	import { fly } from 'svelte/transition';

	// The reader is a native speaker who does not read Vietnamese: this screen stays Georgian + English.
	const LABELS: Record<ItemType, { ka: string; en: string }> = {
		letter: { ka: 'ასოები', en: 'Letters' },
		cluster: { ka: 'თანხმოვანთა ჯგუფები', en: 'Consonant clusters' },
		word: { ka: 'სიტყვები', en: 'Words' },
		phrase: { ka: 'ფრაზები', en: 'Phrases' }
	};

	/** Items with at least one complete reading; a second reader is welcome to add another. */
	let done = $state(new Set<string>());
	let readings = $state(0);
	let loading = $state(true);
	let failed = $state(false);
	let filter = $state<ItemType | 'all'>('all');
	let current = $state<Item | null>(null);

	async function refresh() {
		try {
			const found = await pb.collection('recordings').getFullList({ fields: 'id,item,audio', requestKey: null });
			// Exactly three takes, nothing less: a half-finished item stays on the list.
			const complete = found.filter((r) => (r.audio as string[])?.length === TAKES);
			done = new Set(complete.map((r) => r.item as string));
			readings = complete.length;
			failed = false;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void refresh();
		return releaseMic;
	});

	/** Saving an item moves straight on to the next one, so a long session needs no navigation. */
	async function saved() {
		const finished = current?.id;
		await refresh();
		current = nextUnrecorded(done, finished) ?? null;
	}

	// While a take is being read, the tab bar steps aside: a mis-tap mid-reading would leave the screen.
	$effect(() => {
		ui.immersive = current !== null;
		return () => (ui.immersive = false);
	});

	const total = $derived(recordedCount(done));
	const shown = $derived(filter === 'all' ? CATALOGUE : byType(filter));
	const upNext = $derived(nextUnrecorded(done));
</script>

<main class="page">
	{#if current}
		{#key current.id}
			<Recorder item={current} onsaved={saved} onclose={() => (current = null)} />
		{/key}
	{:else}
		<header class="bar">
			<a class="icon-btn" href="/" aria-label="Back"><Icon name="back" /></a>
			<h1>ჩაწერა <span class="muted">Recording</span></h1>
		</header>

		{#if loading}
			<p class="muted">იტვირთება… Loading…</p>
		{:else}
			{#if failed}<p class="error" role="alert">სია ვერ განახლდა. The list could not be refreshed.</p>{/if}

			<section class="summary">
				<p class="count">{total.done}<span>/{total.total}</span></p>
				<div class="bar-track"><i style:width="{(total.done / total.total) * 100}%"></i></div>
				<p class="muted">
					ჩაწერილია / recorded{#if readings > total.done}<span> · {readings} ჩანაწერი / readings</span>{/if}
				</p>
			</section>

			<div class="actions">
				<button class="btn primary" onclick={() => (current = upNext ?? null)} disabled={!upNext}>
					{#if upNext}
						{total.done ? 'გაგრძელება · Continue' : 'დაწყება · Start recording'}
					{:else}
						დასრულდა · All done
					{/if}
				</button>
			</div>

			<p class="muted consent">
				ჩაწერით თქვენ ეთანხმებით პირობებს.
				<span lang="en">By recording you agree to the <a href="/terms">terms</a> and the <a href="/privacy">privacy notice</a>.</span>
			</p>

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
					<li in:fly={{ y: 10, duration: dur(200), delay: dur(Math.min(i, 12) * 20), easing: ease }}>
						<button class="row" class:recorded={done.has(item.id)} onclick={() => (current = item)}>
							<span class="glyph" lang="ka">{item.text}</span>
							<span class="about">
								<span class="translit">{item.translit}</span>
								{#if item.example}<span class="muted" lang="ka">{item.example}</span>{/if}
								{#if item.meaning}<span class="muted">{item.meaning.en}</span>{/if}
							</span>
							<span class="mark" aria-label={done.has(item.id) ? 'recorded' : 'not recorded'}>{done.has(item.id) ? '●' : '○'}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
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
	.row {
		display: grid;
		width: 100%;
		grid-template-columns: minmax(3.5rem, auto) 1fr auto;
		align-items: center;
		gap: 14px;
		padding: 10px 12px;
		border: 0;
		border-radius: 10px;
		background: var(--tile);
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}
	.row.recorded .mark { color: var(--ok); }
	.glyph { font-family: var(--font-glyph); font-size: 1.5rem; }
	.about { display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; }
	.translit { font-weight: 500; }
	.mark { color: var(--rule-strong); font-size: 1.1rem; }
	.error { color: var(--bad); font-size: 0.9rem; }
	.consent { font-size: 0.8rem; line-height: 1.5; }
</style>
