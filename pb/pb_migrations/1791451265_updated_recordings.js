/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_392670462")

  // update field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "file410859157",
    "maxSelect": 3,
    "maxSize": 524288,
    "mimeTypes": [
      "audio/webm",
      "video/webm",
      "audio/ogg",
      "audio/mp4",
      "video/mp4",
      "audio/mpeg"
    ],
    "name": "audio",
    "presentable": false,
    "protected": true,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_392670462")

  // update field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "file410859157",
    "maxSelect": 3,
    "maxSize": 524288,
    "mimeTypes": [
      "audio/webm",
      "video/webm",
      "audio/ogg",
      "audio/mp4",
      "video/mp4",
      "audio/mpeg"
    ],
    "name": "audio",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
