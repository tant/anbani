<script lang="ts">
	import { levelOf, mic } from '$lib/mic';
	import { pb } from '$lib/pb';
	import { AUDIO, baseMime, pickMime, takeName, TAKES, type Item } from '$lib/recording';
	import Icon from './Icon.svelte';

	// The reader is a native speaker who does not read Vietnamese: this screen stays Georgian + English.
	let {
		item,
		existing,
		onsaved,
		onclose
	}: {
		item: Item;
		/** A row already stored for this item; recording it again replaces that row. */
		existing?: string;
		onsaved: () => void;
		onclose: () => void;
	} = $props();

	interface Take {
		blob: Blob;
		url: string;
		seconds: number;
	}

	const HINT: Record<Item['type'], string> = {
		letter: 'ასო · letter',
		cluster: 'თანხმოვანთა ჯგუფი · consonant cluster',
		word: 'სიტყვა · word',
		phrase: 'ფრაზა · phrase'
	};

	let takes = $state<(Take | null)[]>(Array(TAKES).fill(null));
	/** Which of the three takes the next recording fills. */
	let slot = $state(0);
	let recording = $state(false);
	/** Opening the microphone takes a moment the first time; a second tap must not start a second recorder. */
	let arming = $state(false);
	let level = $state(0);
	let saving = $state(false);
	let error = $state('');

	let recorder: MediaRecorder | undefined;
	let cutoff: ReturnType<typeof setTimeout> | undefined;
	let frame = 0;

	const filled = $derived(takes.filter(Boolean).length);
	const complete = $derived(filled === TAKES);

	$effect(() => () => {
		clearTimeout(cutoff);
		cancelAnimationFrame(frame);
		if (recorder?.state === 'recording') recorder.stop();
		for (const take of takes) if (take) URL.revokeObjectURL(take.url);
	});

	function meter(analyser: AnalyserNode) {
		const buffer = new Uint8Array(analyser.fftSize);
		const tick = () => {
			level = levelOf(analyser, buffer);
			if (recording) frame = requestAnimationFrame(tick);
			else level = 0;
		};
		tick();
	}

	async function start() {
		if (recording || arming) return;
		arming = true;
		error = '';
		let stream: MediaStream;
		let analyser: AnalyserNode;
		try {
			({ stream, analyser } = await mic());
		} catch {
			arming = false;
			error = 'მიკროფონზე წვდომა არ არის. Microphone access is blocked — allow it in the browser settings for this site, then reload.';
			return;
		}
		const mime = pickMime((m) => MediaRecorder.isTypeSupported(m));
		if (!mime) {
			arming = false;
			error = 'ამ ბრაუზერს ჩაწერა არ შეუძლია. This browser cannot record audio; try Chrome or Safari.';
			return;
		}

		const chunks: Blob[] = [];
		const index = slot;
		const startedAt = performance.now();
		recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: AUDIO.bitrate });
		recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
		recorder.onstop = () => {
			clearTimeout(cutoff);
			recording = false;
			const blob = new Blob(chunks, { type: baseMime(mime) });
			if (!blob.size) {
				error = 'ჩანაწერი ცარიელია. That take came back empty — try again.';
				return;
			}
			if (blob.size > AUDIO.maxBytes) {
				error = 'ჩანაწერი ძალიან გრძელია. That take is too long; read the item on its own and stop straight after.';
				return;
			}
			takes[index]?.url && URL.revokeObjectURL(takes[index]!.url);
			takes[index] = { blob, url: URL.createObjectURL(blob), seconds: (performance.now() - startedAt) / 1000 };
			const empty = takes.findIndex((take) => !take);
			if (empty >= 0) slot = empty;
		};
		recorder.start();
		recording = true;
		arming = false;
		// A stuck recorder would otherwise fill the whole take with room noise.
		cutoff = setTimeout(stop, AUDIO.maxSeconds * 1000);
		meter(analyser);
	}

	function stop() {
		if (recorder?.state === 'recording') recorder.stop();
	}

	/** One tap to replace a single take, instead of starting the item over. */
	function redo(index: number) {
		if (recording || arming) return;
		slot = index;
		void start();
	}

	function playTake(index: number) {
		const take = takes[index];
		if (take) void new Audio(take.url).play().catch(() => {});
	}

	async function store() {
		if (!complete || saving) return;
		saving = true;
		error = '';
		const reader = pb.authStore.record?.id;
		try {
			const body = new FormData();
			body.append('item', item.id);
			body.append('status', 'pending');
			body.append('reader', reader ?? '');
			takes.forEach((take, i) => {
				body.append('audio', new File([take!.blob], takeName(item, i + 1, take!.blob.type), { type: take!.blob.type }));
			});
			// Takes cannot be slipped into a stored row one at a time, so a fresh row replaces the old.
			if (existing) await pb.collection('recordings').delete(existing);
			await pb.collection('recordings').create(body);
			onsaved();
		} catch {
			error = 'შენახვა ვერ მოხერხდა. Could not save — check the connection and try again.';
			saving = false;
		}
	}
</script>

<section class="recorder">
	<header class="bar">
		<button class="icon-btn" onclick={onclose} aria-label="Back to the list"><Icon name="back" /></button>
		<p class="kind">{HINT[item.type]}</p>
	</header>

	<div class="read">
		<p class="glyph" lang="ka">{item.text}</p>
		{#if item.example}
			<p class="example" lang="ka">{item.example}</p>
			<p class="muted">read the word above, not the cluster on its own</p>
		{/if}
		<p class="translit">{item.translit}</p>
		{#if item.meaning}<p class="muted">{item.meaning.en}</p>{/if}
	</div>

	<ol class="takes">
		{#each takes as take, i (i)}
			<li class:on={recording && slot === i} class:empty={!take}>
				<span class="no">{i + 1}</span>
				{#if take}
					<button class="chip" onclick={() => playTake(i)}>მოსმენა · Play <span class="muted">{take.seconds.toFixed(1)}s</span></button>
					<button class="chip" onclick={() => redo(i)} disabled={recording || arming}>ხელახლა · Again</button>
				{:else if recording && slot === i}
					<span class="muted">იწერება… recording…</span>
				{:else}
					<span class="muted">ცარიელი · empty</span>
				{/if}
			</li>
		{/each}
	</ol>

	<div class="meter" aria-hidden="true"><i style:transform="scaleX({recording ? level : 0})"></i></div>

	{#if error}<p class="error" role="alert">{error}</p>{/if}

	<div class="actions bottom">
		{#if recording}
			<button class="btn primary stop" onclick={stop}>გაჩერება · Stop</button>
		{:else if arming}
			<button class="btn primary" disabled>მზადება… Getting ready…</button>
		{:else if complete}
			<button class="btn primary" onclick={store} disabled={saving}>
				{saving ? 'ინახება… Saving…' : 'შენახვა · Save all three'}
			</button>
		{:else}
			<button class="btn primary" onclick={start}>
				ჩაწერა · Record <span class="muted">{filled + 1}/{TAKES}</span>
			</button>
		{/if}
	</div>
</section>

<style>
	.recorder { display: flex; flex-direction: column; gap: 16px; flex: 1; }
	.kind { font-size: 0.85rem; color: var(--muted); }

	.read { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
	.glyph { font-family: var(--font-glyph); font-size: clamp(3.4rem, 18vw, 6rem); line-height: 1.1; }
	.example { font-family: var(--font-glyph); font-size: 1.6rem; }
	.translit { font-size: 1.1rem; font-weight: 600; }

	.takes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
	.takes li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border-radius: 12px;
		background: var(--tile);
	}
	.takes li.on { outline: 2px solid var(--lapis); }
	.no {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 999px;
		background: var(--rule);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}
	.takes li:not(.empty) .no { background: var(--ok); color: var(--paper); }

	.chip {
		min-height: 36px;
		padding: 0 12px;
		border: 1.5px solid var(--rule-strong);
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		font-size: 0.85rem;
		cursor: pointer;
	}
	.chip[disabled] { opacity: 0.5; }

	.meter { height: 10px; border-radius: 5px; background: var(--rule); overflow: hidden; }
	.meter i { display: block; height: 100%; background: var(--lapis); transform-origin: left; transition: transform 0.08s linear; }

	.stop { background: var(--bad); border-color: var(--bad); }
	.error { color: var(--bad); font-size: 0.9rem; }
	.actions.bottom { margin-top: auto; }
</style>
