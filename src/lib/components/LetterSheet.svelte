<script lang="ts">
	import type { Letter } from '$lib/letters';
	import { settings, t } from '$lib/settings.svelte';
	import Staff from './Staff.svelte';

	let { letter, onclose }: { letter: Letter | null; onclose: () => void } = $props();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (letter && !dialog.open) dialog.showModal();
		if (!letter && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} {onclose} onclick={(e) => e.target === dialog && dialog.close()}>
	{#if letter}
		<div class="sheet">
			<Staff char={letter.char} size="7.5rem" write />
			<p class="sound">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
			<p class="hint">{letter.hint[settings.lang]}</p>
			<button class="btn" onclick={() => dialog.close()}>{t('close')}</button>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: 100%;
		max-width: 560px;
		margin: auto auto 0;
		padding: 24px 16px max(24px, env(safe-area-inset-bottom));
		border: 0;
		border-radius: 24px 24px 0 0;
		background: var(--paper);
		color: var(--ink);
	}
	dialog::backdrop { background: rgb(14 22 41 / 0.5); }
	dialog[open] { animation: sheet-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }
	dialog[open]::backdrop { animation: fade 0.24s ease-out; }
	@media (min-width: 640px) {
		dialog { margin: auto; border-radius: 24px; }
		dialog[open] { animation-name: pop-in; }
	}
	@keyframes sheet-up {
		from { transform: translateY(100%); }
	}
	@keyframes pop-in {
		from { opacity: 0; transform: translateY(12px) scale(0.97); }
	}
	@keyframes fade {
		from { opacity: 0; }
	}
	.sheet { display: flex; flex-direction: column; gap: 16px; }
	.sound { font-size: 2rem; font-weight: 600; text-align: center; }
	.sound .muted { font-size: 1.1rem; font-weight: 400; }
	.hint { max-width: 60ch; }
</style>
