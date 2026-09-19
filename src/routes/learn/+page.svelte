<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Question from '$lib/components/Question.svelte';
	import Staff from '$lib/components/Staff.svelte';
	import { relativeTime } from '$lib/i18n';
	import { byChar } from '$lib/letters';
	import { buildOptions } from '$lib/options';
	import { answer, introduce, progress } from '$lib/progress.svelte';
	import { nextTask, SESSION_LENGTH, type Task } from '$lib/session';
	import { settings, t } from '$lib/settings.svelte';
	import { parseKey } from '$lib/srs';
	import { dur, ease } from '$lib/motion';
	import { Tween } from 'svelte/motion';

	let task = $state<Task>({ kind: 'done', nextDue: null });
	let options = $state<string[]>([]);
	let seq = $state(0);
	let answered = $state(0);
	let right = $state(0);
	let paused = $state(false);
	let lastKey: string | undefined;

	const letter = $derived(task.kind === 'intro' ? byChar.get(task.char)! : null);
	const score = new Tween(0, { duration: dur(700), easing: ease });

	$effect(() => {
		if (task.kind === 'done') score.target = right;
		else score.set(0, { duration: 0 });
	});

	function show(next: Task) {
		task = next;
		seq += 1;
		if (next.kind !== 'question') return;
		const known = new Set(Object.keys(progress.cards).map((k) => parseKey(k).item));
		options = buildOptions(next.char, next.skill, settings.distractors, { known, confusions: progress.confusions, rng: Math.random });
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

	function record(chosen: string, ms: number) {
		if (task.kind !== 'question') return;
		lastKey = task.key;
		answered += 1;
		if (answer(task.skill, task.char, chosen, ms)) right += 1;
	}

	function learnt() {
		if (task.kind !== 'intro') return;
		introduce(task.char);
		advance();
	}

	function onkeydown(e: KeyboardEvent) {
		if (task.kind !== 'intro' || e.target instanceof HTMLButtonElement) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			learnt();
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
			<Staff char={letter.char} size="min(11rem, 40vw)" tone="lapis" write />
			<p class="sound rise" style:--d="9">{letter.translit} <span class="muted">/{letter.ipa}/</span></p>
			<p class="hint rise" style:--d="10">{letter.hint[settings.lang]}</p>
		</section>
		<div class="actions bottom"><button class="btn primary" onclick={learnt}>{t('gotIt')}</button></div>
	{:else if task.kind === 'question'}
		{#key seq}
			<Question skill={task.skill} char={task.char} {options} onanswer={record} onnext={advance} />
		{/key}
	{:else}
		<section class="stage done">
			<h1 class="rise">{paused ? t('sessionDone') : t('allCaughtUp')}</h1>
			{#if answered}
				<p class="big rise" style:--d="1" aria-label={t('sessionStats', { right, total: answered })}>{Math.round(score.current)}<span>/{answered}</span></p>
			{/if}
			{#if task.kind === 'done' && task.nextDue}
				<p class="muted rise" style:--d="2">{t('comeBack', { time: relativeTime(task.nextDue, new Date(), settings.lang) })}</p>
			{/if}
		</section>
		<div class="actions bottom rise" style:--d="4">
			<a class="btn primary" href="/test?scope=studied">{t('testLearned')}</a>
			{#if paused}<button class="btn" onclick={keepGoing}>{t('keepGoing')}</button>{/if}
			<a class="btn" href="/">{t('backHome')}</a>
		</div>
	{/if}
</main>

<style>
	.sound { font-size: 2.2rem; font-weight: 600; text-align: center; }
	.sound .muted { font-size: 1.1rem; font-weight: 400; }
	.done { justify-content: center; gap: 12px; padding-top: 20vh; }
	.done h1 { font-size: 1.6rem; font-weight: 600; }
	.big { font-size: 4rem; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
	.big span { font-size: 1.8rem; color: var(--muted); }
</style>
