/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
import { preferCached, worthKeeping } from './lib/shell';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `anbani-${version}`;
const ASSETS = ['/', ...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// SvelteKit asks this file whether a newer build exists, so a cached answer would say no forever.
	if (url.pathname === '/_app/version.json') return;

	// Opening the app answers from the network first. Cached-first here is what made a cold start show
	// yesterday's code and then reload itself a moment later; the cache is the offline fallback, not
	// the first answer. Everything under _app/immutable is named by its contents and stays cache-first.
	if (event.request.mode === 'navigate' && event.request.method === 'GET' && url.origin === location.origin) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE);
				try {
					const fresh = await fetch(event.request);
					if (worthKeeping(fresh, location.origin)) void cache.put('/', fresh.clone());
					// A deploy swaps containers behind the proxy; for those few seconds the last good
					// copy is a better answer than the proxy's error page.
					if (preferCached(fresh)) return (await cache.match('/')) ?? fresh;
					return fresh;
				} catch {
					return (await cache.match('/')) ?? Response.error();
				}
			})()
		);
		return;
	}

	const skip = event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_/');
	if (skip) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}
			try {
				return await fetch(event.request);
			} catch {
				// offline: any app route falls back to the SPA shell
				return (await cache.match(event.request)) ?? (await cache.match('/')) ?? Response.error();
			}
		})()
	);
});
