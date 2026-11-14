# PocketCon 2027

The site for **PocketCon 2027**, a free livestream on the state of PocketBase and PocketHost. Saturday, February 6, 2027, on [Discord](https://discord.gg/nVTxCMEcGT).

Live at **https://pocketcon.dev** (also https://pocketcon.pockethost.io).

Built with [PocketPages](https://pocketpages.dev) and hosted on [PocketHost](https://pockethost.io).

## Develop

```bash
npm install
pocketbase --dir=pb_data --dev serve   # PocketBase 0.23+
```

Pages are in `pb_hooks/pages`. Static files (CSS, JS, favicon, calendar file) are in `pb_public`.

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
