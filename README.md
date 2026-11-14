# PocketCon 2027

The site for **PocketCon 2027**, a free livestream about PocketBase. Saturday, February 6, 2027, on [Discord](https://discord.gg/XkAetnQEuc).

Live at **https://pocketcon.dev** (also https://pocketcon.pockethost.io).

Built with [PocketPages](https://pocketpages.dev) and hosted on [PocketHost](https://pockethost.io).

## Develop

The site is a [PocketPages v1](https://pocketpages.dev) app (`pb_pages/`) served by the PocketOne binary, which has PocketPages built in. No npm install.

```bash
pocketone superuser upsert admin@example.com password --dir=pb_data
pocketone serve --dev --dir=pb_data --migrationsDir=pb_migrations --publicDir=pb_public
```

Pages are in `pb_pages` (`+layout.ejs` is the shared header and footer; `_private/event.js` holds the date and links; `_private/splash.svg` is generated from `design/tshirt-v2.html` by `design/splash.py`). Static files (CSS, `app.js`, favicon, calendar file) are in `pb_public`. Registration (email, Google, GitHub), talk proposals and attendee offers use the PocketBase JS SDK against the site's own API; the collections and their access rules are in `pb_migrations/`. Proposals are only visible to their owner (and superusers); offers only to signed-in users.

## Deploy

Pushes to `main` deploy with `npx pockethost@latest deploy pocketcon` (see `.github/workflows/deploy.yml`). The workflow needs a `POCKETHOST_TOKEN` secret: a PocketHost API token with write access to the `pocketcon` instance.

By hand:

```bash
npx pockethost@latest login
npm install
npx pockethost@latest deploy pocketcon
```

## License

MIT
