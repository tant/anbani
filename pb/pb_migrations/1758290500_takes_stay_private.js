/// <reference path="../pb_data/types.d.ts" />

// There is no review step and nothing is played back in the app, so a take has no audience: it is
// reference material the project keeps. Dropping the approved branch from the read rule leaves the
// person who recorded it and the project owner, and nobody else — not a signed-in learner, not a
// caller holding the file address. Restoring playback later means restoring that branch.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		const read = '@request.auth.id != "" && (reader = @request.auth.id || @request.auth.role = "owner")';
		recordings.listRule = read;
		recordings.viewRule = read;
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		const read =
			'status = "approved" || (@request.auth.id != "" && (reader = @request.auth.id || @request.auth.role = "owner"))';
		recordings.listRule = read;
		recordings.viewRule = read;
		app.save(recordings);
	}
);
