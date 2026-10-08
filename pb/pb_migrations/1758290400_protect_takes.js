/// <reference path="../pb_data/types.d.ts" />

// Until now a take could be fetched by anyone who held its address, however the row above it was
// guarded: the file route ignored the rules. Protecting the field makes a file follow the rule of
// its own record, which is what was intended all along.
//
// What changes: a take that is waiting for review, or was sent back, is reachable only by the person
// who recorded it, the project owner and a superuser — and only through a short-lived file token,
// since the file route does not read the Authorization header. An approved take stays open, because
// it is published material: a learner plays it, and anything a browser can play it can also save.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.fields.getByName('audio').protected = true;
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.fields.getByName('audio').protected = false;
		app.save(recordings);
	}
);
