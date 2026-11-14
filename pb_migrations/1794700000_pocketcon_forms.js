/// <reference path="../pb_data/types.d.ts" />

// PocketCon: attendee accounts (the built-in users collection), topic suggestions with votes, and talk proposals.
// Topics and their vote counts are public; votes and proposals are only visible to their owner (and superusers).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const topics = new Collection({
      type: 'base',
      name: 'topics',
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != "" && @request.body.author = @request.auth.id',
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'title', required: true, min: 3, max: 120 },
        { type: 'text', name: 'details', max: 1000 },
        { type: 'relation', name: 'author', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
    })
    app.save(topics)

    const votes = new Collection({
      type: 'base',
      name: 'topic_votes',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: null,
      deleteRule: 'user = @request.auth.id',
      fields: [
        { type: 'relation', name: 'topic', required: true, collectionId: topics.id, maxSelect: 1, cascadeDelete: true },
        { type: 'relation', name: 'user', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        { type: 'autodate', name: 'created', onCreate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_topic_votes_topic_user ON topic_votes (topic, user)'],
    })
    app.save(votes)

    const scores = new Collection({
      type: 'view',
      name: 'topic_scores',
      listRule: '',
      viewRule: '',
      viewQuery: `SELECT t.id, t.title, t.details, t.created, COUNT(v.id) AS votes
        FROM topics t LEFT JOIN topic_votes v ON v.topic = t.id
        GROUP BY t.id`,
    })
    app.save(scores)

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
    for (const name of ['talk_proposals', 'topic_scores', 'topic_votes', 'topics']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  }
)
