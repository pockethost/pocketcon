// GET /setup/status: which sign-in providers are on (no secrets).
module.exports = {
  get(ctx) {
    const s = ctx.resolve('oauthsetup')
    s.requireSuperuser(ctx)
    return ctx.res.json(s.status(ctx.app))
  },
}
