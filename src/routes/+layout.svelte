<script lang="ts">
	import '@fontsource-variable/noto-sans-georgian';
	import '@fontsource-variable/noto-serif-georgian';
	import '@fontsource-variable/lexend';
	import '../app.css';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
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
		document.documentElement.dataset.glyph = settings.glyphFont;
	});

	// Native cross-page transition; browsers without it navigate instantly.
	onNavigate((navigation) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
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
