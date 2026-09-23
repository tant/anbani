<script lang="ts">
	import { dur, ease } from '$lib/motion';
	import { pb } from '$lib/pb';
	import { t } from '$lib/settings.svelte';
	import { load, save } from '$lib/storage';
	import { slide } from 'svelte/transition';

	const DISMISSED_KEY = 'save-progress-dismissed';

	let user = $state(pb.authStore.record);
	$effect(() => pb.authStore.onChange(() => (user = pb.authStore.record)));

	let dismissed = $state(load(DISMISSED_KEY, false));

	function later() {
		dismissed = true;
		save(DISMISSED_KEY, true);
	}
</script>

{#if !user && !dismissed}
	<section class="card rise" style:--d="5" transition:slide={{ duration: dur(320), easing: ease }}>
		<h2>{t('saveProgress')}</h2>
		<p class="muted">{t('saveProgressWhy')}</p>
		<div class="row">
			<a class="btn primary" href="/settings">{t('saveProgressGo')}</a>
			<button class="btn" onclick={later}>{t('saveProgressLater')}</button>
		</div>
	</section>
{/if}

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px;
		border: 1.5px solid var(--rule);
		border-radius: var(--radius);
		background: var(--tile);
	}
	h2 { font-size: 1rem; font-weight: 600; }
	.muted { font-size: 0.9rem; }
	.row { display: flex; flex-wrap: wrap; gap: 10px; }
	.row .btn { flex: 1 1 auto; }
</style>
