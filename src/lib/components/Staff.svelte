<script lang="ts">
	let {
		char,
		size = '8rem',
		tone = 'ink',
		write = false
	}: { char: string; size?: string; tone?: string; write?: boolean } = $props();
</script>

<span class="staff" class:write lang="ka" style:font-size={size} style:color="var(--{tone})"><span class="ink">{char}</span></span>

<style>
	/* Georgian copybook: ascender, x-height, baseline (heavier), descender. */
	.staff {
		display: block;
		height: 1.36em;
		font-family: var(--font-glyph);
		line-height: 1.36;
		text-align: center;
		background:
			linear-gradient(var(--rule), var(--rule)) 0 var(--staff-asc) / 100% 1px no-repeat,
			linear-gradient(var(--rule), var(--rule)) 0 var(--staff-x) / 100% 1px no-repeat,
			linear-gradient(var(--rule-strong), var(--rule-strong)) 0 var(--staff-base) / 100% 2px no-repeat,
			linear-gradient(var(--rule), var(--rule)) 0 var(--staff-desc) / 100% 1px no-repeat;
		transition: color 0.25s ease-out, background-color 0.2s;
	}
	.ink { display: inline-block; }
	:global(:root[data-glyph='system']) .staff { background: none; }

	/* A new letter: the rules are drawn, then the glyph is inked onto them. */
	.write { animation: rules 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
	.write .ink { animation: ink 0.6s 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both; }

	@keyframes rules {
		from { background-size: 0 1px, 0 1px, 0 2px, 0 1px; }
	}
	@keyframes ink {
		from { opacity: 0; transform: translateY(0.06em) scale(0.96); filter: blur(6px); }
	}
</style>
