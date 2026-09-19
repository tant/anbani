<script lang="ts">
	import '@fontsource-variable/noto-serif-georgian';
	import '@fontsource-variable/lexend';
	import '../app.css';
	import { onMount } from 'svelte';
	import { pb } from '$lib/pb';
	import { pull, push } from '$lib/progress.svelte';
	import { adoptProfile, settings } from '$lib/settings.svelte';

	let { children } = $props();

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

{@render children()}
