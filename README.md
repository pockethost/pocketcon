# PocketCon 2027

The site for **PocketCon 2027**, a free livestream about PocketBase. Saturday, February 6, 2027, on [Discord](https://discord.gg/XkAetnQEuc).

Live at **https://pocketcon.dev** (also https://pocketcon.pockethost.io).

Built with [PocketPages](https://pocketpages.dev) and hosted on [PocketHost](https://pockethost.io).

## Develop

```bash
npm install
pocketbase --dir=pb_data --dev serve   # PocketBase 0.23+
```

Pages are in `pb_hooks/pages` (`+layout.ejs` is the shared header and footer). Static files (CSS, `app.js`, favicon, calendar file) are in `pb_public`. Registration, topic suggestions with votes, and talk proposals use the PocketBase JS SDK against the site's own API; the collections and their access rules are in `pb_migrations/`. Votes and proposals are only visible to their owner (and superusers).

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
