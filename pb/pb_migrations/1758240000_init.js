/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.add(new SelectField({ name: 'lang', values: ['vi', 'en'], maxSelect: 1 }));
		users.fields.add(new NumberField({ name: 'distractors', min: 2, max: 5, onlyInt: true }));
		app.save(users);

		const owner = 'user = @request.auth.id';
		const reviews = new Collection({
			type: 'base',
			name: 'reviews',
			listRule: owner,
			viewRule: owner,
			createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
			updateRule: `${owner} && (@request.body.user:isset = false || @request.body.user = @request.auth.id)`,
			deleteRule: owner,
			fields: [
				{ name: 'user', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
				{ name: 'key', type: 'text', required: true, max: 64 },
				{ name: 'card', type: 'json', required: true, maxSize: 4000 },
				{ name: 'due', type: 'date' },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: ['CREATE UNIQUE INDEX idx_reviews_user_key ON reviews (user, `key`)']
		});
		app.save(reviews);
	},
	(app) => {
		app.delete(app.findCollectionByNameOrId('reviews'));
		const users = app.findCollectionByNameOrId('users');
		users.fields.removeByName('lang');
		users.fields.removeByName('distractors');
		app.save(users);
	}
);
