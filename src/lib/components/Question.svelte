<script lang="ts">
	import { byChar } from '$lib/letters';
	import { settings, t } from '$lib/settings.svelte';
	import type { Skill } from '$lib/srs';
	import { slide, fly } from 'svelte/transition';
	import { dur, ease } from '$lib/motion';
	import Staff from './Staff.svelte';

	let {
		skill,
		char,
		options,
		onanswer,
		onnext
	}: {
		skill: Skill;
		char: string;
		options: string[];
		onanswer: (chosen: string, ms: number) => void;
		onnext: () => void;
	} = $props();

	let chosen = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	const shownAt = performance.now();

	const letter = $derived(byChar.get(char)!);
	const picked = $derived(chosen ? byChar.get(chosen)! : null);
	const wrong = $derived(chosen !== null && chosen !== char);

	$effect(() => () => clearTimeout(timer));

	function choose(option: string) {
		if (chosen) return;
		chosen = option;
		onanswer(option, performance.now() - shownAt);
		if (option === char) timer = setTimeout(onnext, 700);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (!chosen) {
			const i = Number(e.key) - 1;
			if (Number.isInteger(i) && i >= 0 && i < options.length) choose(options[i]);
		} else if (wrong && (e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
			// a focused button already handles Enter/Space itself
			e.preventDefault();
			onnext();
		}
	}
</script>

<svelte:window {onkeydown} />

<section class="stage" in:fly={{ x: 28, duration: dur(260), easing: ease }}>
	<p class="prompt">{skill === 'read' ? t('promptRead') : t('promptRecall')}</p>
	{#if skill === 'read'}
		<Staff char={letter.char} size={wrong ? '6rem' : 'min(11rem, 40vw)'} tone={chosen === char ? 'ok' : 'ink'} />
	{:else}
		<p class="prompt-sound" class:right={chosen === char}>{letter.translit}</p>
	{/if}
</section>

{#if wrong && picked}
	<section class="compare" aria-live="polite" transition:slide={{ duration: dur(240), easing: ease }}>
		<div>
			<span class="muted">{t('youChose')}</span>
			<Staff char={picked.char} size="3.2rem" tone="bad" />
			<span class="sound-sm">{picked.translit}</span>
		</div>
		<div>
			<span class="muted">{t('correctAnswer')}</span>
			<Staff char={letter.char} size="3.2rem" tone="ok" />
			<span class="sound-sm">{letter.translit}</span>
		</div>
		<p class="hint">{letter.hint[settings.lang]}</p>
	</section>
{/if}

<div class="options" class:many={options.length > 4} role="group" aria-label={t('choicesLabel')} in:fly={{ y: 16, duration: dur(280), delay: dur(60), easing: ease }}>
	{#each options as option, i (option)}
		{@const o = byChar.get(option)!}
		<button
			class="option"
			class:ok={chosen !== null && option === char}
			class:bad={chosen === option && option !== char}
			aria-disabled={chosen !== null}
			onclick={() => choose(option)}
		>
			<kbd>{i + 1}</kbd>
			{#if skill === 'read'}
				<span class="opt-sound">{o.translit}</span>
			{:else}
				<span class="opt-glyph" lang="ka">{o.char}</span>
			{/if}
		</button>
	{/each}
</div>

{#if wrong}
	<div class="actions"><button class="btn primary" onclick={onnext}>{t('next')}</button></div>
{/if}

<style>
	.prompt-sound.right { color: var(--ok); }
	.prompt-sound {
		transition: color 0.25s ease-out;
		font-size: clamp(4rem, 22vw, 6.5rem);
		font-weight: 600;
		text-align: center;
		line-height: 1.3;
		padding: 0.3em 0;
		border-block: 1px solid var(--rule);
	}

	.compare {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px 16px;
		text-align: center;
		font-size: 0.9rem;
	}
	.compare .hint { grid-column: 1 / -1; text-align: left; font-size: 1rem; }
	.sound-sm { font-size: 1.2rem; font-weight: 600; }

	.options {
		margin-top: auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	@media (min-width: 520px) {
		.options.many { grid-template-columns: repeat(3, 1fr); }
	}
	.option {
		position: relative;
		min-height: 76px;
		border: 1.5px solid var(--rule-strong);
		border-radius: var(--radius);
		background: var(--tile);
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s, transform 0.08s ease-out;
	}
	.option[aria-disabled='true'] { cursor: default; }
	.option.ok { background: var(--ok); border-color: var(--ok); color: var(--paper); animation: pop 0.32s cubic-bezier(0.3, 1.5, 0.5, 1); }
	.option.bad { background: var(--bad); border-color: var(--bad); color: var(--paper); animation: shake 0.36s ease-in-out; }
	@keyframes pop {
		50% { transform: scale(1.05); }
	}
	@keyframes shake {
		20%, 60% { transform: translateX(-6px); }
		40%, 80% { transform: translateX(6px); }
	}
	.opt-sound { font-size: 1.7rem; font-weight: 600; }
	.opt-glyph { font-family: var(--font-glyph); font-size: 2.6rem; line-height: 1.3; }
	kbd {
		display: none;
		position: absolute;
		top: 6px;
		left: 10px;
		font-family: inherit;
		font-size: 0.75rem;
		color: var(--muted);
	}
	@media (hover: hover) and (pointer: fine) {
		kbd { display: block; }
		.option:hover:not([aria-disabled='true']) { border-color: var(--lapis); }
	}
	.option.ok kbd, .option.bad kbd { color: inherit; }
</style>
