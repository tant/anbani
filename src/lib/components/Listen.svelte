<script lang="ts">
	import { t } from '$lib/settings.svelte';
	import { hasVoice, playVoice } from '$lib/voices.svelte';

	let { item, size = 'md' }: { item: string; size?: 'sm' | 'md' } = $props();

	let playing = $state(false);
	let fade: ReturnType<typeof setTimeout> | undefined;

	$effect(() => () => clearTimeout(fade));

	function play() {
		playVoice(item);
		playing = true;
		clearTimeout(fade);
		fade = setTimeout(() => (playing = false), 600);
	}
</script>

{#if hasVoice(item)}
	<button class="listen" class:sm={size === 'sm'} class:playing onclick={play} aria-label={t('listen')}>
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<path d="M4 9.5h3L12 6v12l-5-3.5H4z" />
			<path d="M16 9a4 4 0 0 1 0 6" />
			<path d="M18.8 6.5a7.5 7.5 0 0 1 0 11" />
		</svg>
	</button>
{/if}

<style>
	.listen {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		transition: background 0.2s, color 0.2s, transform 0.2s;
	}
	.listen.sm { width: 38px; height: 38px; }
	.listen.playing { background: var(--lapis); border-color: var(--lapis); color: var(--on-lapis); transform: scale(1.06); }
</style>
