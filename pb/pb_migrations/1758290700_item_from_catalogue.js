/// <reference path="../pb_data/types.d.ts" />

// An open create rule with a free-text item was unbounded: the index allows one row per item value,
// not one row in total, so a caller could invent item names for as long as the disk lasted — and the
// disk holds the database the whole app runs on. Limiting the item to the catalogue turns the index
// into a real cap, and a smaller per-take ceiling turns that cap into a comfortable number: 85 items
// times three takes times 128 KB is about 32 MB, against a 256 MiB volume. A take of ten seconds,
// the longest the recorder allows, measures about 25 KB.
//
// The note field goes with it. It was written for the review screen that no longer exists, and the
// list is public now, so an unused field is only something to read.
//
// The values below must stay equal to CATALOGUE in src/lib/recording.ts; recording.test.ts fails if
// they drift apart.
const ITEMS = [
		"letter:ა",
		"letter:ბ",
		"letter:გ",
		"letter:დ",
		"letter:ე",
		"letter:ვ",
		"letter:ზ",
		"letter:თ",
		"letter:ი",
		"letter:კ",
		"letter:ლ",
		"letter:მ",
		"letter:ნ",
		"letter:ო",
		"letter:პ",
		"letter:ჟ",
		"letter:რ",
		"letter:ს",
		"letter:ტ",
		"letter:უ",
		"letter:ფ",
		"letter:ქ",
		"letter:ღ",
		"letter:ყ",
		"letter:შ",
		"letter:ჩ",
		"letter:ც",
		"letter:ძ",
		"letter:წ",
		"letter:ჭ",
		"letter:ხ",
		"letter:ჯ",
		"letter:ჰ",
		"cluster:mts-v",
		"cluster:brts-q",
		"cluster:tskhv",
		"cluster:tkb",
		"cluster:skhv",
		"cluster:tkv",
		"cluster:vkhvd",
		"cluster:mkvl",
		"cluster:prtskvn",
		"cluster:dzv",
		"word:water",
		"word:bread",
		"word:wine",
		"word:coffee",
		"word:tea",
		"word:house",
		"word:city",
		"word:street",
		"word:friend",
		"word:mother",
		"word:father",
		"word:child",
		"word:day",
		"word:night",
		"word:man",
		"word:woman",
		"word:book",
		"word:car",
		"word:shop",
		"word:good",
		"word:bad",
		"word:big",
		"word:small",
		"word:green",
		"phrase:hello",
		"phrase:morning",
		"phrase:evening",
		"phrase:night",
		"phrase:how-are-you",
		"phrase:im-fine",
		"phrase:thanks",
		"phrase:thanks-a-lot",
		"phrase:youre-welcome",
		"phrase:sorry",
		"phrase:please",
		"phrase:yes",
		"phrase:no",
		"phrase:goodbye",
		"phrase:how-much",
		"phrase:dont-understand",
		"phrase:where-is",
		"phrase:my-name-is"
	];

migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		// The index has to go before the field it covers can be replaced.
		recordings.indexes = [];
		recordings.fields.removeByName('note');
		recordings.fields.removeByName('item');
		recordings.fields.addAt(1, new SelectField({ name: 'item', required: true, maxSelect: 1, values: ITEMS }));
		recordings.fields.getByName('audio').maxSize = 131072;
		recordings.indexes = ['CREATE UNIQUE INDEX idx_recordings_item ON recordings (item)'];
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.indexes = [];
		recordings.fields.removeByName('item');
		recordings.fields.addAt(1, new TextField({ name: 'item', required: true, max: 120 }));
		recordings.fields.add(new TextField({ name: 'note', required: false, max: 500 }));
		recordings.fields.getByName('audio').maxSize = 524288;
		recordings.indexes = ['CREATE UNIQUE INDEX idx_recordings_item ON recordings (item)'];
		app.save(recordings);
	}
);
