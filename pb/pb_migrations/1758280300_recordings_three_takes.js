/// <reference path="../pb_data/types.d.ts" />

// Each item is read three times in one sitting and all three takes are kept: the reader does not
// have to judge their own best attempt, and playback can pick or vary later. Audio is spoken word,
// so a low bitrate is plenty; the cap stays small on purpose.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		const audio = recordings.fields.getByName('audio');
		audio.maxSelect = 3;
		audio.maxSize = 524288; // 512 KB per take is generous for ~3 s of 24 kbps mono Opus
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		const audio = recordings.fields.getByName('audio');
		audio.maxSelect = 1;
		audio.maxSize = 2097152;
		app.save(recordings);
	}
);
