// POST /setup/github/start: a one-time state for the GitHub App manifest flow.
module.exports = {
  post(ctx) {
    const s = ctx.resolve('oauthsetup')
    s.requireSuperuser(ctx)
    return ctx.res.json({ state: s.newGitHubState(ctx) })
  },
}
