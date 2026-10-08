/// <reference path="../pb_data/types.d.ts" />

// Anyone holding the link can record, with no account, so the one thing left to bound is how much a
// stranger could pour in. Items are limited to the 85 in the catalogue and a take to 128 KB, but the
// number of readings is deliberately open: every voice reading the same letter is wanted, and one
// person reading a letter again adds three more takes rather than replacing the last three.
//
// The ceiling below is a backstop against filling the disk the database lives on, not a quota on
// contributors, and it is deliberately far out of reach: 20000 readings is about 235 passes of the
// whole catalogue, some 300 MB of real audio, against a disk with 130 GB free. Spamming towards it
// is what the rate limit on recordings:create makes expensive — a ceiling without one can be reached
// in minutes and then blocks the people it was meant to protect. If it is ever reached in earnest,
// raise it, or move file storage to the S3 that is already available.
//
// The ceiling is declared inside the handler on purpose: PocketBase runs each hook in its own VM,
// so a constant in the surrounding file is not in scope at request time.
onRecordCreateRequest((e) => {
	const CEILING = 20000;
	if ($app.countRecords('recordings') >= CEILING) {
		throw new ApiError(429, 'The recording library is full; ask the project owner to make room.', null);
	}
	e.next();
}, 'recordings');
