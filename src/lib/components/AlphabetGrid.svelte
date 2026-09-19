<script lang="ts">
	import { ALPHABET } from '$lib/letters';
	import Staff from './Staff.svelte';

	let {
		tone,
		caption,
		label,
		pressed,
		onpick,
		fill = false
	}: {
		tone: (char: string) => string;
		caption: (char: string) => string;
		label: (char: string) => string;
		pressed?: (char: string) => boolean;
		onpick: (char: string) => void;
		/** Ink the letters in one after another, like a copybook page being written. */
		fill?: boolean;
	} = $props();
</script>

<ol class="alphabet" class:fill>
	{#each ALPHABET as letter, i (letter.char)}
		<li style:--i={i}>
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
	.fill li { animation: ink-in 0.45s calc(var(--i) * 18ms) cubic-bezier(0.2, 0.8, 0.2, 1) both; }
	@keyframes ink-in {
		from { opacity: 0; transform: translateY(6px); }
	}
	.tile:hover :global(.staff) { background-color: var(--tile); }
	.caption { font-size: 0.8rem; color: var(--muted); text-align: center; min-height: 1.2em; }
	.tile[aria-pressed='true'] .caption { color: var(--lapis); font-weight: 600; }
	.tile[aria-pressed='true'] :global(.staff) { background-color: color-mix(in srgb, var(--lapis) 16%, transparent); }
</style>
