/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.add(new SelectField({ name: 'glyphFont', values: ['sans', 'serif', 'system'], maxSelect: 1 }));
		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.removeByName('glyphFont');
		app.save(users);
	}
);
