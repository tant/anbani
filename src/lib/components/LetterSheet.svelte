<script lang="ts">
	import type { Letter } from '$lib/letters';
	import { settings, t } from '$lib/settings.svelte';
	import { dur } from '$lib/motion';
	import Staff from './Staff.svelte';

	let { letter, onclose }: { letter: Letter | null; onclose: () => void } = $props();
	let dialog: HTMLDialogElement;

	/** Play the closing animation, then close; instant when motion is reduced. */
	let closing = $state(false);

	function dismiss() {
		if (!dialog.open || closing) return;
		if (!dur(1)) return dialog.close();
		closing = true;
	}

	function finish(e: AnimationEvent) {
		if (!closing || e.target !== dialog) return;
		closing = false;
		dialog.close();
	}

	$effect(() => {
		if (letter && !dialog.open) dialog.showModal();
		if (!letter && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class:closing
	onanimationend={finish}
	{onclose}
	oncancel={(e) => {
		e.preventDefault();
		dismiss();
	}}
	onclick={(e) => e.target === dialog && dismiss()}
>
	{#if letter}
		<div class="sheet">
			<Staff char={letter.char} size="7.5rem" write />
			<p class="sound">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
			<p class="hint">{letter.hint[settings.lang]}</p>
			<button class="btn" onclick={dismiss}>{t('close')}</button>
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
	dialog.closing { animation: sheet-down 0.22s ease-in both; }
	dialog.closing::backdrop { animation: fade 0.22s ease-in reverse both; }
	@media (min-width: 640px) {
		dialog.closing { animation-name: pop-out; }
	}
	@keyframes sheet-down {
		to { transform: translateY(100%); }
	}
	@keyframes pop-out {
		to { opacity: 0; transform: translateY(12px) scale(0.97); }
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
