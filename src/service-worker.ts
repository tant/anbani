/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `anbani-${version}`;
// Recordings outlive a release: they are immutable files with a random name, so they are kept in
// their own cache that a new version does not sweep away.
const AUDIO = 'anbani-audio';
const ASSETS = ['/', ...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== AUDIO).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// A recording never changes once it is served: keep the first copy so a letter already heard can
	// still be played with no connection.
	if (event.request.method === 'GET' && url.pathname.startsWith('/api/files/')) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(AUDIO);
				const hit = await cache.match(event.request);
				if (hit) return hit;
				const res = await fetch(event.request);
				if (res.ok) void cache.put(event.request, res.clone());
				return res;
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
