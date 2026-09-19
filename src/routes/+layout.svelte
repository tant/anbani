<script lang="ts">
	import '@fontsource-variable/noto-serif-georgian';
	import '@fontsource-variable/lexend';
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import { pb } from '$lib/pb';
	import { pull, push } from '$lib/progress.svelte';
	import { adoptProfile, settings } from '$lib/settings.svelte';
	import { ui } from '$lib/ui.svelte';

	let { children } = $props();

	const immersive = $derived(page.url.pathname === '/learn' || ui.immersive);

	$effect(() => {
		document.documentElement.lang = settings.lang;
	});

	onMount(() => {
		if (pb.authStore.isValid) {
			pb.collection('users')
				.authRefresh()
				.then(({ record }) => adoptProfile(record))
				.then(pull)
				.catch(() => {});
		}
		const online = () => void push();
		addEventListener('online', online);
		return () => removeEventListener('online', online);
	});
</script>

<div class="app" class:with-nav={!immersive}>
	{@render children()}
</div>
{#if !immersive}<Nav />{/if}
