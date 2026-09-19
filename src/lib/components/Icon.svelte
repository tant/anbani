<script lang="ts">
	let { name }: { name: 'settings' | 'close' | 'back' } = $props();
</script>

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	{#if name === 'settings'}
		<path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
		<circle cx="16" cy="7" r="2" />
		<circle cx="8" cy="17" r="2" />
	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6L6 18" />
	{:else}
		<path d="M15 5l-7 7 7 7" />
	{/if}
</svg>
