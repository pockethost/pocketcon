// GET /setup/github/callback?code&state: GitHub sends the browser here after "Create GitHub App".
// The state (made by a superuser's /setup/github/start) is the authorization; the code is swapped for the
// app's client ID and secret, which go straight into the users collection.
module.exports = {
  get(ctx) {
    const s = ctx.resolve('oauthsetup')
    if (!s.takeGitHubState(ctx, ctx.req.query('state'))) {
      return ctx.res.redirect('/setup', { flash: { error: 'GitHub setup expired or was already used. Start again.' } })
    }
    try {
      const app = s.convertManifestCode(ctx.req.query('code'), s.githubAPI(ctx))
      s.saveProvider(ctx.app, 'github', app.clientId, app.clientSecret)
      ctx.log.info('oauthsetup: github provider saved', 'slug', app.slug)
      return ctx.res.redirect('/setup', { flash: { ok: `GitHub sign-in is on (GitHub App "${app.slug}").`, github: app.htmlURL } })
    } catch (err) {
      ctx.log.error('oauthsetup: github failed', 'error', String(err))
      return ctx.res.redirect('/setup', { flash: { error: `GitHub setup failed: ${err.message || err}` } })
    }
  },
}
