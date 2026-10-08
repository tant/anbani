/// <reference path="../pb_data/types.d.ts" />

// Recording is open: whoever holds the link reads and saves, with no account and nothing recorded
// about who they are. The `reader` relation goes, because a take that carries an account id is not
// anonymous, and the request log stops keeping IP addresses for the same reason.
//
// The rules are split so the screen can work without opening the audio to anyone:
//   list   — open, so the screen knows which items already have their three takes
//   view   — the owner alone, and a protected file follows this rule, so a take downloads for nobody else
//   create — anyone, as long as the row arrives unreviewed
//   delete — anyone, while the row is unreviewed, so a misread item can be recorded again; one row
//            per item is enforced by the index, which also caps what an open endpoint can ever store
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.fields.removeByName('reader');
		recordings.listRule = '';
		recordings.viewRule = '@request.auth.id != "" && @request.auth.role = "owner"';
		recordings.createRule = '@request.body.status = "pending"';
		recordings.deleteRule = 'status != "approved"';
		app.save(recordings);

		const settings = app.settings();
		settings.logs.logIP = false;
		app.save(settings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.fields.add(
			new RelationField({
				name: 'reader',
				required: false,
				maxSelect: 1,
				collectionId: app.findCollectionByNameOrId('users').id,
				cascadeDelete: false
			})
		);
		recordings.listRule = '@request.auth.id != "" && (reader = @request.auth.id || @request.auth.role = "owner")';
		recordings.viewRule = recordings.listRule;
		recordings.createRule = [
			'@request.auth.id != ""',
			'(@request.auth.role = "reader" || @request.auth.role = "owner")',
			'@request.body.reader = @request.auth.id',
			'@request.body.status = "pending"'
		].join(' && ');
		recordings.deleteRule =
			'@request.auth.id != "" && (@request.auth.role = "owner" || (reader = @request.auth.id && status != "approved"))';
		app.save(recordings);

		const settings = app.settings();
		settings.logs.logIP = true;
		app.save(settings);
	}
);
