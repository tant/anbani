/// <reference path="../pb_data/types.d.ts" />

// Reading every row was too open: a recording waiting for review, the note explaining why one was
// rejected, and the reader's account id were all public. Learners only ever need approved audio;
// the reader keeps sight of their own work, and a superuser sees everything regardless of rules.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.listRule = 'status = "approved" || reader = @request.auth.id';
		recordings.viewRule = 'status = "approved" || reader = @request.auth.id';
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.listRule = '';
		recordings.viewRule = '';
		app.save(recordings);
	}
);
