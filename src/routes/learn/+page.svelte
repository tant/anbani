<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Staff from '$lib/components/Staff.svelte';
	import { relativeTime } from '$lib/i18n';
	import { byChar } from '$lib/letters';
	import { buildOptions } from '$lib/options';
	import { answer, introduce, progress } from '$lib/progress.svelte';
	import { nextTask, SESSION_LENGTH, type Task } from '$lib/session';
	import { settings, t } from '$lib/settings.svelte';
	import { parseKey } from '$lib/srs';

	let task = $state<Task>({ kind: 'done', nextDue: null });
	let options = $state<string[]>([]);
	let chosen = $state<string | null>(null);
	let answered = $state(0);
	let right = $state(0);
	let paused = $state(false);
	let shownAt = 0;
	let lastKey: string | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const letter = $derived(task.kind === 'done' ? null : byChar.get(task.char)!);
	const wrong = $derived(task.kind === 'question' && chosen !== null && chosen !== task.char);
	const picked = $derived(chosen ? byChar.get(chosen)! : null);

	function show(next: Task) {
		clearTimeout(timer);
		task = next;
		chosen = null;
		if (next.kind !== 'question') return;
		const known = new Set(Object.keys(progress.cards).map((k) => parseKey(k).item));
		options = buildOptions(next.char, next.skill, settings.distractors, { known, confusions: progress.confusions, rng: Math.random });
		shownAt = performance.now();
	}

	function advance() {
		const next = nextTask(progress.cards, new Date(), lastKey);
		paused = answered >= SESSION_LENGTH && next.kind !== 'done';
		show(paused ? { kind: 'done', nextDue: null } : next);
	}

	function keepGoing() {
		answered = 0;
		right = 0;
		advance();
	}

	function choose(option: string) {
		if (task.kind !== 'question' || chosen) return;
		chosen = option;
		lastKey = task.key;
		answered += 1;
		if (answer(task.skill, task.char, option, performance.now() - shownAt)) {
			right += 1;
			timer = setTimeout(advance, 700);
		}
	}

	function learnt() {
		if (task.kind !== 'intro') return;
		introduce(task.char);
		advance();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (task.kind === 'question' && !chosen) {
			const i = Number(e.key) - 1;
			if (Number.isInteger(i) && i >= 0 && i < options.length) choose(options[i]);
			return;
		}
		// a focused button already handles Enter/Space itself
		if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
			if (task.kind === 'intro') learnt();
			else if (wrong) advance();
			else return;
			e.preventDefault();
		}
	}

	show(nextTask(progress.cards, new Date()));
</script>

<svelte:window {onkeydown} />

<main class="page">
	<header class="bar">
		<a class="icon-btn" href="/" aria-label={t('stop')}><Icon name="close" /></a>
		<progress max={SESSION_LENGTH} value={answered} aria-label={t('progress')}></progress>
	</header>

	{#if task.kind === 'intro' && letter}
		<section class="stage">
			<p class="prompt">{t('newLetter')}</p>
			<Staff char={letter.char} size="min(11rem, 40vw)" tone="lapis" />
			<p class="sound">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
			<p class="hint">{letter.hint[settings.lang]}</p>
		</section>
		<div class="actions bottom"><button class="btn primary" onclick={learnt}>{t('gotIt')}</button></div>
	{:else if task.kind === 'question' && letter}
		<section class="stage">
			<p class="prompt">{task.skill === 'read' ? t('promptRead') : t('promptRecall')}</p>
			{#if task.skill === 'read'}
				<Staff char={letter.char} size={wrong ? '6rem' : 'min(11rem, 40vw)'} />
			{:else}
				<p class="prompt-sound">{letter.translit}</p>
			{/if}
		</section>

		{#if wrong && picked}
			<section class="compare" aria-live="polite">
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

		<div class="options" class:many={options.length > 4} role="group" aria-label={t('choicesLabel')}>
			{#each options as option, i (option)}
				{@const o = byChar.get(option)!}
				<button
					class="option"
					class:ok={chosen !== null && option === task.char}
					class:bad={chosen === option && option !== task.char}
					aria-disabled={chosen !== null}
					onclick={() => choose(option)}
				>
					<kbd>{i + 1}</kbd>
					{#if task.skill === 'read'}
						<span class="opt-sound">{o.translit}</span>
					{:else}
						<span class="opt-glyph" lang="ka">{o.char}</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if wrong}
			<div class="actions"><button class="btn primary" onclick={advance}>{t('next')}</button></div>
		{/if}
	{:else}
		<section class="stage done">
			<h1>{paused ? t('sessionDone') : t('allCaughtUp')}</h1>
			{#if answered}<p>{t('sessionStats', { right, total: answered })}</p>{/if}
			{#if task.kind === 'done' && task.nextDue}
				<p class="muted">{t('comeBack', { time: relativeTime(task.nextDue, new Date(), settings.lang) })}</p>
			{/if}
		</section>
		<div class="actions bottom">
			{#if paused}<button class="btn primary" onclick={keepGoing}>{t('keepGoing')}</button>{/if}
			<a class="btn" href="/">{t('backHome')}</a>
		</div>
	{/if}
</main>

<style>
	progress {
		flex: 1;
		height: 6px;
		appearance: none;
		border: 0;
		border-radius: 3px;
		background: var(--rule);
		overflow: hidden;
	}
	progress::-webkit-progress-bar { background: var(--rule); }
	progress::-webkit-progress-value { background: var(--lapis); transition: width 0.3s; }
	progress::-moz-progress-bar { background: var(--lapis); }

	.stage { display: flex; flex-direction: column; gap: 16px; }
	.stage.done { justify-content: center; gap: 12px; padding-top: 20vh; }
	.done h1 { font-size: 1.6rem; font-weight: 600; }
	.prompt { color: var(--muted); }
	.prompt-sound {
		font-size: clamp(4rem, 22vw, 6.5rem);
		font-weight: 600;
		text-align: center;
		line-height: 1.3;
		padding: 0.3em 0;
		border-block: 1px solid var(--rule);
	}
	.sound { font-size: 2.2rem; font-weight: 600; text-align: center; }
	.sound .muted { font-size: 1.1rem; font-weight: 400; }
	.hint { max-width: 60ch; }

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
		transition: background-color 0.15s, border-color 0.15s;
	}
	.option[aria-disabled='true'] { cursor: default; }
	.option.ok { background: var(--ok); border-color: var(--ok); color: var(--paper); }
	.option.bad { background: var(--bad); border-color: var(--bad); color: var(--paper); }
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

	.actions { display: flex; flex-direction: column; gap: 10px; padding-bottom: env(safe-area-inset-bottom); }
	.actions.bottom { margin-top: auto; }
</style>
