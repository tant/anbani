<script lang="ts">
	import { page } from '$app/state';
	import type { MessageKey } from '$lib/messages';
	import { progress } from '$lib/progress.svelte';
	import { t } from '$lib/settings.svelte';
	import { dueCount } from '$lib/srs';
	import Icon from './Icon.svelte';

	const tabs: { href: string; label: MessageKey; icon?: 'learn' | 'test' | 'settings' }[] = [
		{ href: '/', label: 'alphabet' },
		{ href: '/learn', label: 'learn', icon: 'learn' },
		{ href: '/test', label: 'test', icon: 'test' },
		{ href: '/settings', label: 'settings', icon: 'settings' }
	];

	const due = $derived(dueCount(progress.cards, new Date()));
</script>

<nav aria-label={t('mainNav')}>
	{#each tabs as tab (tab.href)}
		<a href={tab.href} aria-current={page.url.pathname === tab.href ? 'page' : undefined}>
			<span class="icon">
				{#if tab.icon}
					<Icon name={tab.icon} />
				{:else}
					<span class="glyph" lang="ka" aria-hidden="true">ა</span>
				{/if}
				{#if tab.href === '/learn' && due}
					{#key due}<span class="badge"><span class="visually-hidden">{t('dueCount', { n: due })}</span><span aria-hidden="true">{due}</span></span>{/key}
				{/if}
			</span>
			<span>{t(tab.label)}</span>
		</a>
	{/each}
</nav>

<style>
	nav {
		view-transition-name: tabbar;
		position: fixed;
		bottom: 0;
		left: 50%;
		z-index: 10;
		width: 100%;
		max-width: 560px;
		transform: translateX(-50%);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		padding: 4px 8px env(safe-area-inset-bottom);
		background: var(--paper);
		border-top: 1px solid var(--rule);
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: var(--nav-height);
		border-radius: 12px;
		color: var(--muted);
		font-size: 0.72rem;
		text-decoration: none;
	}
	a[aria-current='page'] { color: var(--lapis); font-weight: 600; }
	.icon { position: relative; display: grid; place-items: center; height: 28px; width: 56px; }
	.icon::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 999px;
		background: color-mix(in srgb, var(--lapis) 16%, transparent);
		opacity: 0;
		transform: scaleX(0.4);
		transition: opacity 0.2s, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	a[aria-current='page'] .icon::before { opacity: 1; transform: none; }
	.icon > :not(.badge) { position: relative; }
	a { transition: color 0.2s; }
	.glyph { font-family: var(--font-glyph); font-size: 1.45rem; line-height: 1; }
	.badge {
		animation: pop 0.4s cubic-bezier(0.3, 1.6, 0.5, 1);
		position: absolute;
		top: -4px;
		left: 32px;
		min-width: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--bad);
		color: var(--paper);
		font-size: 0.68rem;
		font-weight: 600;
		line-height: 18px;
		text-align: center;
	}
	@keyframes pop {
		from { transform: scale(0.4); }
	}
</style>
