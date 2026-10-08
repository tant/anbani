/// <reference path="../pb_data/types.d.ts" />

// A WebM file holding only Opus audio is still a WebM container, and a sniffer reports it as
// video/webm — that is the type the server itself hands back when it serves a take. The upload gets
// through today because the browser declares audio/webm, which is a thin thread to hang the whole
// recording flow on, so both spellings are allowed.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.fields.getByName('audio').mimeTypes = [
			'audio/webm',
			'video/webm',
			'audio/ogg',
			'audio/mp4',
			'video/mp4',
			'audio/mpeg'
		];
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.fields.getByName('audio').mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'];
		app.save(recordings);
	}
);
