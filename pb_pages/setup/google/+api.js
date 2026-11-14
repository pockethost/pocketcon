// POST /setup/google { clientId, clientSecret, redirectURI }: checks the pair with Google, then saves it.
module.exports = {
  post(ctx) {
    const s = ctx.resolve('oauthsetup')
    s.requireSuperuser(ctx)
    const { clientId, clientSecret, redirectURI } = ctx.req.body() || {}
    const id = String(clientId || '').trim()
    const secret = String(clientSecret || '').trim()
    if (!/\.apps\.googleusercontent\.com$/.test(id)) throw ctx.httpError(400, 'The client ID ends in .apps.googleusercontent.com.')
    if (!secret) throw ctx.httpError(400, 'Paste the client secret too.')
    const check = s.checkGoogleClient(id, secret, String(redirectURI || ''))
    if (!check.ok) throw ctx.httpError(400, `Google rejected that client ID and secret (${check.error}).`)
    s.saveProvider(ctx.app, 'google', id, secret)
    return ctx.res.json({ ok: true, status: s.status(ctx.app) })
  },
}
