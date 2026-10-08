<script lang="ts">
	import type { Letter } from '$lib/letters';
	import { progress } from '$lib/progress.svelte';
	import { settings, t } from '$lib/settings.svelte';
	import { dur } from '$lib/motion';
	import Listen from './Listen.svelte';
	import Staff from './Staff.svelte';

	let { letter, onclose }: { letter: Letter | null; onclose: () => void } = $props();

	const score = $derived(letter ? progress.mastery[letter.char] : undefined);
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
			<div class="say">
				<p class="sound">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
				<Listen item="letter:{letter.char}" />
			</div>
			<p class="hint">{letter.hint[settings.lang]}</p>
			{#if score !== undefined}
				<div class="mastery">
					<p>{t('masteryLabel')} <strong>{score}</strong><span class="muted">/100</span></p>
					<div class="bar"><i style:width="{score}%"></i></div>
				</div>
			{/if}
			<button class="btn" onclick={dismiss}>{t('close')}</button>
		</div>
	{/if}
</dialog>

<style>
	.say { display: flex; align-items: center; gap: 12px; }
	.mastery { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 280px; }
	.mastery p { font-size: 0.9rem; }
	.bar { height: 8px; border-radius: 4px; background: var(--rule); overflow: hidden; }
	.bar i { display: block; height: 100%; background: var(--lapis); transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }

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
