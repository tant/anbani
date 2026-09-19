<script lang="ts">
	let { name }: { name: 'settings' | 'close' | 'back' | 'learn' | 'test' } = $props();
</script>

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	{#if name === 'settings'}
		<path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
		<circle cx="16" cy="7" r="2" />
		<circle cx="8" cy="17" r="2" />
	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6L6 18" />
	{:else if name === 'learn'}
		<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
		<path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
	{:else if name === 'test'}
		<rect x="4" y="4" width="16" height="16" rx="3" />
		<path d="M8.5 12.5l2.5 2.5 4.5-5" />
	{:else}
		<path d="M15 5l-7 7 7 7" />
	{/if}
</svg>
