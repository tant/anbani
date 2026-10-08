/// <reference path="../pb_data/types.d.ts" />

// Anyone holding the link can record, with no account, so the one thing left to bound is how much a
// stranger could pour in. Items are limited to the 85 in the catalogue and a take to 128 KB, but the
// number of readings is deliberately open: every voice reading the same letter is wanted, and one
// person reading a letter again adds three more takes rather than replacing the last three.
//
// The ceiling below is not a quota on contributors. It sits far above any real session — 5000
// readings is about 58 passes of the whole catalogue, some 75 MB of real audio, 1.9 GB even if every
// take arrived at its 128 KB limit — and exists only so an open endpoint cannot fill the disk the
// database lives on. If it is ever reached in earnest, raise it, or move file storage to S3.
//
// The ceiling is declared inside the handler on purpose: PocketBase runs each hook in its own VM,
// so a constant in the surrounding file is not in scope at request time.
onRecordCreateRequest((e) => {
	const CEILING = 5000;
	if ($app.countRecords('recordings') >= CEILING) {
		throw new ApiError(429, 'The recording library is full; ask the project owner to make room.', null);
	}
	e.next();
}, 'recordings');
