<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { pb } from '$lib/pb';
	import { CATALOGUE, TAKES } from '$lib/recording';
	import { t } from '$lib/settings.svelte';
	import { loadVoices } from '$lib/voices.svelte';

	interface Pending {
		id: string;
		item: string;
		urls: string[];
		note: string;
	}

	const byId = new Map(CATALOGUE.map((item) => [item.id, item]));

	let user = $state(pb.authStore.record);
	let waiting = $state<Pending[]>([]);
	let approved = $state(0);
	let loading = $state(true);
	let error = $state('');
	let busy = $state('');
	let reasons = $state<Record<string, string>>({});

	const owner = $derived(user?.role === 'owner');

	async function refresh() {
		try {
			const rows = await pb.collection('recordings').getFullList({ fields: 'id,collectionId,item,audio,status,note', requestKey: null });
			waiting = rows
				.filter((r) => r.status !== 'approved')
				.map((r) => ({
					id: r.id,
					item: r.item as string,
					urls: ((r.audio as string[]) ?? []).map((name) => pb.files.getURL(r, name)),
					note: (r.note as string) ?? ''
				}));
			approved = rows.filter((r) => r.status === 'approved').length;
			error = '';
		} catch {
			error = t('serverError');
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (owner) void refresh();
		else loading = false;
	});

	async function decide(row: Pending, status: 'approved' | 'rejected') {
		busy = row.id;
		error = '';
		try {
			const body: Record<string, string> = { status };
			if (status === 'rejected') body.note = reasons[row.id] ?? '';
			await pb.collection('recordings').update(row.id, body);
			await refresh();
			// Approving one publishes it: the learner side reads the approved list, so refresh that too.
			if (status === 'approved') await loadVoices().catch(() => {});
		} catch {
			error = t('reviewFailed');
		} finally {
			busy = '';
		}
	}
</script>

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/record" aria-label={t('close')}><Icon name="back" /></a>
		<h1>{t('reviewTitle')}</h1>
	</header>

	{#if loading}
		<p class="muted">…</p>
	{:else if !owner}
		<p class="muted">{t('reviewDenied')}</p>
	{:else}
		<p class="muted">{t('reviewApproved', { done: approved, total: CATALOGUE.length })}</p>
		{#if error}<p class="error" role="alert">{error}</p>{/if}

		{#if !waiting.length}
			<p class="muted">{t('reviewEmpty')}</p>
		{:else}
			<ul class="queue">
				{#each waiting as row (row.id)}
					{@const item = byId.get(row.item)}
					<li>
						<div class="head">
							<span class="glyph" lang="ka">{item?.text ?? row.item}</span>
							<span class="about">
								<strong>{item?.translit ?? ''}</strong>
								{#if item?.example}<span class="muted" lang="ka">{item.example}</span>{/if}
								{#if row.urls.length !== TAKES}<span class="short">{row.urls.length}/{TAKES}</span>{/if}
							</span>
						</div>

						<div class="takes">
							{#each row.urls as url, i (url)}
								<button class="chip" onclick={() => void new Audio(url).play().catch(() => {})}>{t('takeNo', { n: i + 1 })}</button>
							{/each}
						</div>

						<label class="reason">
							<span class="muted">{t('rejectReason')}</span>
							<input type="text" bind:value={reasons[row.id]} maxlength="500" />
						</label>

						<div class="decide">
							<button class="btn primary" onclick={() => decide(row, 'approved')} disabled={busy === row.id || row.urls.length !== TAKES}>
								{t('approve')}
							</button>
							<button class="btn" onclick={() => decide(row, 'rejected')} disabled={busy === row.id}>{t('sendBack')}</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</main>

<style>
	h1 { font-size: 1.2rem; font-weight: 600; }

	.queue { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
	.queue li { display: flex; flex-direction: column; gap: 10px; padding: 14px 12px; border-radius: 14px; background: var(--tile); }

	.head { display: flex; align-items: center; gap: 14px; }
	.glyph { font-family: var(--font-glyph); font-size: 2rem; }
	.about { display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; }
	.short { color: var(--bad); font-variant-numeric: tabular-nums; }

	.takes { display: flex; flex-wrap: wrap; gap: 8px; }
	.chip {
		min-height: 38px;
		padding: 0 14px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.reason { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
	.reason input {
		min-height: 40px;
		padding: 0 12px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 10px;
		background: var(--paper);
		color: var(--ink);
		font: inherit;
	}

	.decide { display: flex; gap: 8px; }
	.decide .btn { flex: 1; }
	.error { color: var(--bad); font-size: 0.9rem; }
</style>
