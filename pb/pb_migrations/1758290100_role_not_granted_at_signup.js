/// <reference path="../pb_data/types.d.ts" />

// Blocking the role on self-update was only half the door. Creating a user is open — that is how a
// Google sign-in registers a new account — so a plain POST to the users collection could carry
// role: "owner" and hand the caller the review powers outright. Refuse the field at sign-up too;
// a role is granted by a superuser and by nobody else.
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.createRule = '@request.body.role:isset = false';
		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.createRule = '';
		app.save(users);
	}
);
