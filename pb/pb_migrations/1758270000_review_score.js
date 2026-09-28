/// <reference path="../pb_data/types.d.ts" />

// How well the letter is known, 0 to 100 (see src/lib/mastery.ts). Kept on both of a letter's
// rows so it travels with whichever row wins the merge.
migrate(
	(app) => {
		const reviews = app.findCollectionByNameOrId('reviews');
		reviews.fields.add(
			new NumberField({
				name: 'score',
				min: 0,
				max: 100,
				required: false
			})
		);
		app.save(reviews);
	},
	(app) => {
		const reviews = app.findCollectionByNameOrId('reviews');
		reviews.fields.removeByName('score');
		app.save(reviews);
	}
);
