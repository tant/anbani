/// <reference path="../pb_data/types.d.ts" />

// The previous rule had a hole: for an anonymous request @request.auth.id is "", and a row whose
// reader has not been set is "" too, so `reader = @request.auth.id` matched and every unassigned
// pending recording stayed public. Require a signed-in reader before that half of the rule applies.
migrate(
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		const rule = 'status = "approved" || (@request.auth.id != "" && reader = @request.auth.id)';
		recordings.listRule = rule;
		recordings.viewRule = rule;
		app.save(recordings);
	},
	(app) => {
		const recordings = app.findCollectionByNameOrId('recordings');
		recordings.listRule = 'status = "approved" || reader = @request.auth.id';
		recordings.viewRule = 'status = "approved" || reader = @request.auth.id';
		app.save(recordings);
	}
);
