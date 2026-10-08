/// <reference path="../pb_data/types.d.ts" />

// Three roles around the recordings: a native speaker who records, the project owner who reviews,
// and the learner who only ever hears what was approved. The role sits on the user record, granted
// by a superuser; the self-update rule refuses the field so nobody can promote themselves.
//
// The reader never edits a row. A take cannot be added to a stored row one at a time, so an item is
// always written in one go with all three takes, and re-recording means dropping the row and
// writing a fresh one. That keeps "exactly three" true at every moment, not just at the end.
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.add(new SelectField({ name: 'role', values: ['reader', 'owner'], maxSelect: 1 }));
		users.updateRule = 'id = @request.auth.id && @request.body.role:isset = false';
		app.save(users);

		const recordings = app.findCollectionByNameOrId('recordings');
		const read =
			'status = "approved" || (@request.auth.id != "" && (reader = @request.auth.id || @request.auth.role = "owner"))';
		recordings.listRule = read;
		recordings.viewRule = read;
		recordings.createRule = [
			'@request.auth.id != ""',
			'(@request.auth.role = "reader" || @request.auth.role = "owner")',
			'@request.body.reader = @request.auth.id',
			'@request.body.status = "pending"'
		].join(' && ');
		// Approval is the gate that matters. audio:length counts the takes already on the row, so an
		// item that is not exactly three takes cannot reach "approved" however the client asks.
		recordings.updateRule =
			'@request.auth.id != "" && @request.auth.role = "owner" && (@request.body.status != "approved" || audio:length = 3)';
		recordings.deleteRule =
			'@request.auth.id != "" && (@request.auth.role = "owner" || (reader = @request.auth.id && status != "approved"))';
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		const read = 'status = "approved" || (@request.auth.id != "" && reader = @request.auth.id)';
		recordings.listRule = read;
		recordings.viewRule = read;
		recordings.createRule = null;
		recordings.updateRule = null;
		recordings.deleteRule = null;
		app.save(recordings);

		const users = app.findCollectionByNameOrId('users');
		users.fields.removeByName('role');
		users.updateRule = 'id = @request.auth.id';
		app.save(users);
	}
);
