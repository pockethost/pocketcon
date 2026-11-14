// Server side of /setup: wires "Sign in with X" providers into the users collection.
// Secrets go from the provider (or the form) straight into PocketBase settings and are never sent back to the browser.

const COLLECTION = 'users'
const STATE_KEY = 'oauthsetup:github:state'
const STATE_TTL_MS = 60 * 60 * 1000 // GitHub manifest codes are valid for an hour

// Only superusers. The page sends the admin dashboard's token as an Authorization header.
function requireSuperuser(ctx) {
  if (!ctx.auth || !ctx.auth.isSuperuser()) throw ctx.httpError(403, 'Superusers only. Sign in at /_/ first.')
}

function providerConfigs(col) {
  const out = []
  for (const p of col.oauth2.providers) {
    out.push({
      name: p.name,
      clientId: p.clientId,
      clientSecret: p.clientSecret,
      authURL: p.authURL,
      tokenURL: p.tokenURL,
      userInfoURL: p.userInfoURL,
      displayName: p.displayName,
      pkce: p.pkce,
      extra: p.extra,
    })
  }
  return out
}

// Add or replace one provider, keep the others as they are, and turn OAuth2 on.
function saveProvider(app, name, clientId, clientSecret) {
  const col = app.findCollectionByNameOrId(COLLECTION)
  const providers = providerConfigs(col).filter((p) => p.name !== name)
  providers.push({ name, clientId, clientSecret })
  unmarshal({ oauth2: { enabled: true, providers } }, col)
  app.save(col)
}

function status(app) {
  const col = app.findCollectionByNameOrId(COLLECTION)
  const byName = {}
  for (const p of providerConfigs(col)) byName[p.name] = { clientId: p.clientId, hasSecret: !!p.clientSecret }
  return { collection: COLLECTION, enabled: !!col.oauth2.enabled, providers: byName }
}

function newGitHubState(ctx) {
  const state = $security.randomString(40)
  ctx.store(STATE_KEY, JSON.stringify({ state, exp: Date.now() + STATE_TTL_MS }))
  return state
}

// One-time: a state is good for one callback within the hour.
function takeGitHubState(ctx, state) {
  const raw = ctx.store(STATE_KEY)
  ctx.store(STATE_KEY, '')
  if (!raw || !state) return false
  const saved = JSON.parse(raw)
  return saved.state === state && Date.now() < saved.exp
}

// GitHub swaps the one-time manifest code for the new app's credentials. No auth needed: the code is the proof.
function convertManifestCode(code, apiBase = 'https://api.github.com') {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(code || '')) throw new Error('bad code')
  const res = $http.send({
    url: `${apiBase}/app-manifests/${code}/conversions`,
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'pocketcon-oauthsetup', 'X-GitHub-Api-Version': '2022-11-28' },
    timeout: 15,
  })
  if (res.statusCode !== 201) throw new Error(`GitHub answered ${res.statusCode}: ${res.json?.message || ''}`)
  const app = res.json
  if (!app.client_id || !app.client_secret) throw new Error('GitHub did not return client credentials')
  return { clientId: app.client_id, clientSecret: app.client_secret, slug: app.slug, htmlURL: app.html_url }
}

// Checks a Google client ID/secret pair without signing anyone in: a made-up code is rejected with
// invalid_grant when the client is real, invalid_client when the ID or secret is wrong.
function checkGoogleClient(clientId, clientSecret, redirectURI) {
  const body = [
    ['grant_type', 'authorization_code'],
    ['code', 'pocketcon-oauthsetup-check'],
    ['client_id', clientId],
    ['client_secret', clientSecret],
    ['redirect_uri', redirectURI],
  ]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  const res = $http.send({
    url: 'https://oauth2.googleapis.com/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    timeout: 15,
  })
  const error = res.json?.error || ''
  if (error === 'invalid_client' || error === 'unauthorized_client') return { ok: false, error }
  return { ok: true, error }
}

// Dev mode only: point at a local mock of GitHub (dev/mock-github.py) instead of github.com.
function githubWeb(ctx) {
  return (ctx.dev && ctx.env('OAUTHSETUP_GITHUB_WEB')) || 'https://github.com'
}
function githubAPI(ctx) {
  return (ctx.dev && ctx.env('OAUTHSETUP_GITHUB_API')) || 'https://api.github.com'
}

module.exports = {
  requireSuperuser,
  saveProvider,
  status,
  newGitHubState,
  takeGitHubState,
  convertManifestCode,
  checkGoogleClient,
  githubWeb,
  githubAPI,
}
