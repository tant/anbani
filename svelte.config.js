import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		// An app left open for days would otherwise keep running the build it started with. SvelteKit
		// checks for a newer one on this interval and, when it finds one, upgrades at the next
		// navigation with a full load — at a tap the person made, not as a reload out of nowhere.
		version: { pollInterval: 300_000 }
	}
};
