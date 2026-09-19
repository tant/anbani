<script lang="ts">
	import { ALPHABET } from '$lib/letters';
	import Staff from './Staff.svelte';

	let {
		tone,
		caption,
		label,
		pressed,
		onpick
	}: {
		tone: (char: string) => string;
		caption: (char: string) => string;
		label: (char: string) => string;
		pressed?: (char: string) => boolean;
		onpick: (char: string) => void;
	} = $props();
</script>

<ol class="alphabet">
	{#each ALPHABET as letter (letter.char)}
		<li>
			<button class="tile" aria-label={label(letter.char)} aria-pressed={pressed?.(letter.char)} onclick={() => onpick(letter.char)}>
				<Staff char={letter.char} size="2.4rem" tone={tone(letter.char)} />
				<span class="caption">{caption(letter.char)}</span>
			</button>
		</li>
	{/each}
</ol>

<style>
	.alphabet {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		row-gap: 8px;
	}
	@media (min-width: 520px) {
		.alphabet { grid-template-columns: repeat(11, 1fr); }
	}
	.tile {
		width: 100%;
		min-height: 48px;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}
	.tile:hover :global(.staff) { background-color: var(--tile); }
	.caption { font-size: 0.8rem; color: var(--muted); text-align: center; min-height: 1.2em; }
	.tile[aria-pressed='true'] .caption { color: var(--lapis); font-weight: 600; }
	.tile[aria-pressed='true'] :global(.staff) { background-color: color-mix(in srgb, var(--lapis) 16%, transparent); }
</style>
