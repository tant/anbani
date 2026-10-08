/// <reference path="../pb_data/types.d.ts" />

// Audio recorded by a native speaker, one row per catalogue item (src/lib/recording.ts).
// Roles and the approval flow are tightened in a later migration; for now only a superuser writes.
migrate(
	(app) => {
		const recordings = new Collection({
			name: 'recordings',
			type: 'base',
			listRule: '',
			viewRule: '',
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{ name: 'item', type: 'text', required: true, max: 120 },
				{ name: 'audio', type: 'file', required: false, maxSelect: 1, maxSize: 2097152, mimeTypes: ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'] },
				{ name: 'status', type: 'select', required: true, maxSelect: 1, values: ['pending', 'approved', 'rejected'] },
				{ name: 'reader', type: 'relation', required: false, maxSelect: 1, collectionId: app.findCollectionByNameOrId('users').id, cascadeDelete: false },
				{ name: 'note', type: 'text', required: false, max: 500 },
				{ name: 'created', type: 'autodate', onCreate: true },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: ['CREATE UNIQUE INDEX idx_recordings_item ON recordings (item)']
		});
		app.save(recordings);
	},
	(app) => {
		app.delete(app.findCollectionByNameOrId('recordings'));
	}
);
