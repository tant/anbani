<script lang="ts">
	import AlphabetGrid from '$lib/components/AlphabetGrid.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Question from '$lib/components/Question.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import Staff from '$lib/components/Staff.svelte';
	import { ALPHABET, byChar } from '$lib/letters';
	import { buildOptions, shuffle } from '$lib/options';
	import { progress } from '$lib/progress.svelte';
	import { buildQuiz, scopeChars, summarize, type Direction, type QuizAnswer, type QuizQuestion, type Scope } from '$lib/quiz';
	import { settings, t } from '$lib/settings.svelte';
	import { load, save } from '$lib/storage';
	import { ui } from '$lib/ui.svelte';
	import { dur, ease } from '$lib/motion';
	import { Tween } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	interface Setup {
		scope: Scope;
		direction: Direction;
		custom: string[];
	}

	const setup = $state<Setup>(load('testSetup', { scope: 'all', direction: 'mixed', custom: [] }));
	$effect(() => save('testSetup', setup));

	let phase = $state<'setup' | 'running' | 'result'>('setup');
	let questions = $state<QuizQuestion[]>([]);
	let answers = $state<QuizAnswer[]>([]);
	let index = $state(0);
	let options = $state<string[]>([]);

	const studied = $derived(scopeChars('studied', progress.cards, []).length);
	const chars = $derived(scopeChars(setup.scope, progress.cards, setup.custom));
	const current = $derived(questions[index]);

	$effect(() => {
		ui.immersive = phase === 'running';
		return () => (ui.immersive = false);
	});
	const summary = $derived(summarize(answers));
	const score = new Tween(0, { duration: dur(700), easing: ease });

	$effect(() => {
		if (phase === 'result') score.target = summary.right;
		else score.set(0, { duration: 0 });
	});

	const scopes = $derived([
		{ value: 'all' as const, label: t('scopeAll') },
		{ value: 'studied' as const, label: t('scopeStudied', { n: studied }) },
		{ value: 'custom' as const, label: t('scopeCustom') }
	]);
	const directions = $derived([
		{ value: 'read' as const, label: t('dirRead') },
		{ value: 'recall' as const, label: t('dirRecall') },
		{ value: 'mixed' as const, label: t('dirMixed') }
	]);

	function run(list: QuizQuestion[]) {
		questions = list;
		answers = [];
		index = 0;
		phase = 'running';
		prepare();
	}

	function prepare() {
		const q = questions[index];
		const inTest = new Set(questions.map((x) => x.char));
		options = buildOptions(q.char, q.skill, settings.distractors, { known: inTest, confusions: progress.confusions, rng: Math.random });
	}

	function record(chosen: string) {
		answers.push({ ...current, chosen });
	}

	function next() {
		if (index + 1 >= questions.length) {
			phase = 'result';
			return;
		}
		index += 1;
		prepare();
	}

	function toggle(c: string) {
		setup.custom = setup.custom.includes(c) ? setup.custom.filter((x) => x !== c) : [...setup.custom, c];
	}
</script>

<main class="page">
	{#if phase === 'setup'}
		<header class="bar">
			<h1>{t('test')}</h1>
		</header>

		<section>
			<h2 id="scope-label">{t('scope')}</h2>
			<Segmented name="scope" labelledby="scope-label" options={scopes} value={setup.scope} onchange={(v) => (setup.scope = v)} />
			{#if setup.scope === 'custom'}
				<AlphabetGrid
					tone={(c) => (setup.custom.includes(c) ? 'lapis' : 'rule-strong')}
					caption={(c) => byChar.get(c)!.translit}
					label={(c) => `${c} ${byChar.get(c)!.translit}`}
					pressed={(c) => setup.custom.includes(c)}
					onpick={toggle}
				/>
				<div class="row">
					<button class="link" onclick={() => (setup.custom = ALPHABET.map((l) => l.char))}>{t('selectAll')}</button>
					<button class="link" onclick={() => (setup.custom = [])}>{t('selectNone')}</button>
					<span class="muted">{t('selectedCount', { n: setup.custom.length })}</span>
				</div>
			{/if}
		</section>

		<section>
			<h2 id="direction-label">{t('direction')}</h2>
			<Segmented name="direction" labelledby="direction-label" options={directions} value={setup.direction} onchange={(v) => (setup.direction = v)} />
			<p class="muted">{t('choicesNote', { n: settings.distractors + 1 })} <a href="/settings">{t('changeInSettings')}</a></p>
		</section>

		<footer class="cta">
			{#if !chars.length}<p class="muted">{setup.scope === 'studied' ? t('noStudied') : t('noneSelected')}</p>{/if}
			<button class="btn primary" disabled={!chars.length} onclick={() => run(buildQuiz(chars, setup.direction, Math.random))}>
				{t('startTest', { n: chars.length })}
			</button>
		</footer>
	{:else if phase === 'running' && current}
		<header class="bar">
			<button class="icon-btn" onclick={() => (phase = 'setup')} aria-label={t('quitTest')}><Icon name="close" /></button>
			<progress max={questions.length} value={answers.length} aria-label={t('progress')}></progress>
			<span class="count">{index + 1}/{questions.length}</span>
		</header>
		{#key index}
			<Question skill={current.skill} char={current.char} {options} onanswer={record} onnext={next} />
		{/key}
	{:else}
		<header class="bar">
			<h1>{t('result')}</h1>
		</header>

		<section class="score">
			<p class="big" aria-label="{summary.right}/{summary.total}">{Math.round(score.current)}<span>/{summary.total}</span></p>
			<p class="muted">{t('scorePct', { pct: Math.round((summary.right / summary.total) * 100) })}</p>
		</section>

		{#if summary.wrong.length}
			<section>
				<h2>{t('toReview')}</h2>
				<ul class="missed">
					{#each summary.wrong as a, i (a.char)}
						{@const l = byChar.get(a.char)!}
						{@const p = byChar.get(a.chosen)!}
						<li in:fly={{ y: 12, duration: dur(280), delay: dur(300 + i * 60), easing: ease }}>
							<Staff char={l.char} size="2.6rem" tone="ok" />
							<div>
								<p><strong>{l.translit}</strong> <span class="muted">/{l.ipa}/</span></p>
								<p class="muted">{t('youChose')} <span class="glyph" lang="ka">{p.char}</span> ({p.translit})</p>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<p>{t('perfect')}</p>
		{/if}

		<div class="actions bottom">
			{#if summary.wrong.length}
				<button class="btn primary" onclick={() => run(shuffle(summary.wrong.map(({ char, skill }) => ({ char, skill })), Math.random))}>
					{t('retryWrong', { n: summary.wrong.length })}
				</button>
			{/if}
			<button class="btn" onclick={() => (phase = 'setup')}>{t('newTest')}</button>
		</div>
	{/if}
</main>

<style>
	section { display: flex; flex-direction: column; gap: 12px; }
	h2 { font-size: 1rem; font-weight: 600; }

	.row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; }
	.link {
		min-height: 44px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--lapis);
		font-weight: 500;
		cursor: pointer;
	}

	.cta {
		position: sticky;
		bottom: var(--nav-space, 0px);
		margin-top: auto;
		padding: 12px 0;
		background: var(--paper);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.count { font-size: 0.9rem; color: var(--muted); font-variant-numeric: tabular-nums; }

	.score { align-items: center; padding: 16px 0; gap: 4px; }
	.big { font-size: 4.5rem; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
	.big span { font-size: 2rem; color: var(--muted); }

	.missed { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
	.glyph { font-family: var(--font-glyph); font-size: 1.3em; color: var(--ink); }
	.missed li {
		display: grid;
		grid-template-columns: 4.5rem 1fr;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid var(--rule);
	}
</style>
