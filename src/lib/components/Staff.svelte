<script lang="ts">
	let { char, size = '8rem', tone = 'ink' }: { char: string; size?: string; tone?: string } = $props();
</script>

<span class="staff" lang="ka" style:font-size={size} style:color="var(--{tone})">{char}</span>

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
	}
</style>
