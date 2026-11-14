/// <reference path="../pb_data/types.d.ts" />

// PocketCon: attendee accounts (the built-in users collection) and talk proposals.
// Proposals are only visible to their owner (and superusers).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const proposals = new Collection({
      type: 'base',
      name: 'talk_proposals',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: 'user = @request.auth.id && @request.body.user:isset = false',
      deleteRule: null,
      fields: [
        { type: 'relation', name: 'user', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        { type: 'text', name: 'name', required: true, max: 120 },
        { type: 'email', name: 'email', required: true },
        { type: 'text', name: 'title', required: true, min: 3, max: 140 },
        { type: 'select', name: 'format', required: true, maxSelect: 1, values: ['talk', 'lightning', 'demo'] },
        { type: 'text', name: 'abstract', required: true, min: 20, max: 2000 },
        { type: 'text', name: 'bio', max: 1000 },
        { type: 'text', name: 'links', max: 500 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
    })
    app.save(proposals)

    // Sign-ups and forms are public, so turn on PocketBase's built-in rate limiter (default rules).
    const settings = app.settings()
    settings.rateLimits.enabled = true
    app.save(settings)
  },
  (app) => {
    for (const name of ['talk_proposals']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  }
)
