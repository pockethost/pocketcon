/// <reference path="../pb_data/types.d.ts" />

// Offers for registered attendees: each links to another site (tee store, PocketHost) with a discount code.
// Only signed-in users can list them, so the codes stay with people who registered. Manage them in the admin UI.

migrate(
  (app) => {
    const offers = new Collection({
      type: 'base',
      name: 'offers',
      listRule: '@request.auth.id != "" && active = true',
      viewRule: '@request.auth.id != "" && active = true',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'title', required: true, max: 120 },
        { type: 'text', name: 'description', max: 500 },
        { type: 'url', name: 'url', required: true },
        { type: 'text', name: 'code', max: 60 },
        { type: 'text', name: 'cta', max: 40 },
        { type: 'number', name: 'sort', onlyInt: true },
        { type: 'bool', name: 'active' },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
    })
    app.save(offers)

    // Starting offers, off until their links and codes are real.
    const seed = [
      ['PocketCon 2027 tee', 'The official PocketCon 2027 shirt. Printed and shipped worldwide by our merch partner.', 'Get the tee'],
      ['PocketHost tee', 'Rep the hosting that keeps the lights on.', 'Get the tee'],
      ['PocketHost lifetime plan', 'Host PocketBase on PocketHost for life, at a PocketCon price.', 'Get the deal'],
    ]
    seed.forEach(([title, description, cta], i) => {
      const r = new Record(offers)
      r.set('title', title)
      r.set('description', description)
      r.set('url', 'https://pocketcon.dev/')
      r.set('cta', cta)
      r.set('sort', (i + 1) * 10)
      r.set('active', false)
      app.save(r)
    })
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('offers'))
    } catch (_) {}
  }
)
