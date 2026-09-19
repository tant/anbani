<script lang="ts" generics="T extends string">
	let {
		name,
		labelledby,
		options,
		value,
		onchange
	}: {
		name: string;
		labelledby: string;
		options: { value: T; label: string }[];
		value: T;
		onchange: (value: T) => void;
	} = $props();
</script>

<div class="segmented" role="radiogroup" aria-labelledby={labelledby} style:--cols={options.length}>
	{#each options as o (o.value)}
		<label class:on={value === o.value}>
			<input type="radio" {name} value={o.value} checked={value === o.value} onchange={() => onchange(o.value)} />
			{o.label}
		</label>
	{/each}
</div>

<style>
	.segmented {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		border: 1.5px solid var(--rule-strong);
		border-radius: var(--radius);
		overflow: hidden;
	}
	label {
		display: grid;
		place-items: center;
		min-height: 48px;
		padding: 6px 8px;
		text-align: center;
		line-height: 1.3;
		cursor: pointer;
	}
	label + label { border-left: 1.5px solid var(--rule-strong); }
	label.on { background: var(--lapis); color: var(--on-lapis); }
	label:has(input:focus-visible) { outline: 3px solid var(--lapis); outline-offset: -3px; }
	input { position: absolute; opacity: 0; pointer-events: none; }
</style>
