/// <reference path="../pb_data/types.d.ts" />

// The ceiling in pb_hooks keeps an open endpoint from filling the disk, but on its own it is also a
// weapon: a script could reach it in minutes and then no real contributor could record until the
// owner cleared it. Rate limiting is what makes that expensive, so the ceiling can go back to being
// what it was meant to be — a backstop nobody reaches.
//
// Ten readings a minute from one address is well clear of a person: three takes plus the pauses
// between them is about fifteen seconds of actual reading, so four a minute is a brisk human.
// Syncing progress is the opposite shape — a first sign-in writes a row per letter per direction in
// one burst — so reviews get room, and PocketBase's own defaults cover everything else.
//
// None of that works until the real caller can be told apart. Behind Traefik every request arrives
// from the overlay address, so without this the whole internet shares one bucket and two people
// recording at once would throttle each other. Reading the rightmost entry of X-Forwarded-For is the
// one that cannot be forged: Traefik appends the address it actually saw, and a client that sends
// its own header only adds entries to the left of it.
migrate(
	(app) => {
		const settings = app.settings();
		settings.trustedProxy.headers = ['X-Forwarded-For'];
		settings.trustedProxy.useLeftmostIP = false;
		const keep = settings.rateLimits.rules.filter(
			(r) => !['recordings:create', 'reviews:create', 'reviews:update'].includes(r.label)
		);
		settings.rateLimits.rules = [
			...keep,
			{ label: 'recordings:create', audience: '', maxRequests: 10, duration: 60 },
			{ label: 'reviews:create', audience: '', maxRequests: 150, duration: 60 },
			{ label: 'reviews:update', audience: '', maxRequests: 150, duration: 60 }
		];
		settings.rateLimits.enabled = true;
		app.save(settings);
	},
	(app) => {
		const settings = app.settings();
		settings.trustedProxy.headers = [];
		settings.rateLimits.rules = settings.rateLimits.rules.filter(
			(r) => !['recordings:create', 'reviews:create', 'reviews:update'].includes(r.label)
		);
		settings.rateLimits.enabled = false;
		app.save(settings);
	}
);
