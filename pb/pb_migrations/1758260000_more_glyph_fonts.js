/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.getByName('glyphFont').values = ['sans', 'serif', 'pen', 'round', 'system'];
		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.getByName('glyphFont').values = ['sans', 'serif', 'system'];
		app.save(users);
	}
);
