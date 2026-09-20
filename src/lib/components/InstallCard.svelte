<script lang="ts">
	import { askToInstall, dismissInstall, install } from '$lib/install.svelte';
	import { dur, ease } from '$lib/motion';
	import { t } from '$lib/settings.svelte';
	import { slide } from 'svelte/transition';
	import Icon from './Icon.svelte';
</script>

{#if install.how && !install.dismissed}
	<section class="card" transition:slide={{ duration: dur(320), easing: ease }}>
		<div class="head">
			<span class="badge"><Icon name="install" /></span>
			<div>
				<h2>{t('installTitle')}</h2>
				<p class="muted">{t('installWhy')}</p>
			</div>
		</div>

		{#if install.how === 'prompt'}
			<div class="row">
				<button class="btn primary" onclick={askToInstall}>{t('installAction')}</button>
				<button class="btn" onclick={dismissInstall}>{t('installLater')}</button>
			</div>
		{:else}
			<p class="how">{t('installIos')} <span class="share"><Icon name="share" /></span></p>
			<button class="btn" onclick={dismissInstall}>{t('installGotIt')}</button>
		{/if}
	</section>
{/if}

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 16px;
		border: 1.5px solid var(--rule);
		border-radius: var(--radius);
		background: var(--tile);
	}

	.head { display: flex; gap: 12px; align-items: flex-start; }
	.badge {
		display: grid;
		place-items: center;
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: var(--lapis);
		color: var(--on-lapis);
		animation: nudge 2.4s ease-in-out 1.2s 2;
	}
	@keyframes nudge {
		30% { transform: translateY(-3px); }
		45% { transform: translateY(0); }
		60% { transform: translateY(-2px); }
	}

	h2 { font-size: 1rem; font-weight: 600; }
	.muted { font-size: 0.9rem; }

	.row { display: flex; flex-wrap: wrap; gap: 10px; }
	.row .btn { flex: 1 1 auto; }

	.how { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.95rem; }
	.share { display: inline-grid; place-items: center; color: var(--lapis); }
</style>
