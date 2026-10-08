/// <reference path="../pb_data/types.d.ts" />

// Every reading is kept. One person reads ა three times and those three are stored; the next person
// reads ა and that is three more rows' worth of material, not a replacement. So the unique index on
// item goes, and with it the only reason strangers needed to delete: a redo now adds instead of
// overwriting. Deleting becomes the owner's alone, which also closes the hole where anyone holding
// the link could wipe a session.
//
// The index was the storage bound, so pb_hooks/cap-recordings.pb.js takes over: it refuses new rows
// past a ceiling far above any real use. The volume sits on a 130 GB disk — the 256 MiB on the
// container is a memory limit, not a disk one.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.indexes = [];
		recordings.deleteRule = '@request.auth.id != "" && @request.auth.role = "owner"';
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.indexes = ['CREATE UNIQUE INDEX idx_recordings_item ON recordings (item)'];
		recordings.deleteRule = 'status != "approved"';
		app.save(recordings);
	}
);
