// Shared client code: the PocketBase SDK on this site's own API, sign-in state and form helpers.
;(() => {
  const pb = new PocketBase(location.origin)

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

  // A readable message from a PocketBase error, including field errors ("email: must be unique").
  const message = (err) => {
    const fields = err?.response?.data || {}
    const parts = Object.entries(fields).map(([k, v]) => `${k}: ${v?.message || v}`)
    if (err?.status === 400 && /authenticate/i.test(err?.message || '')) return 'Wrong email or password.'
    if (fields.email?.code === 'validation_not_unique') return 'That email is already registered. Use "I\'m already registered".'
    return parts.length ? parts.join(' · ') : err?.message || String(err)
  }

  // Run a form action: disables its buttons, shows errors in its [data-error].
  const run = async (form, fn) => {
    const errBox = form.querySelector('[data-error]')
    const buttons = form.querySelectorAll('button')
    buttons.forEach((b) => (b.disabled = true))
    if (errBox) errBox.hidden = true
    try {
      await fn()
    } catch (err) {
      if (errBox) {
        errBox.textContent = message(err)
        errBox.hidden = false
      }
    } finally {
      buttons.forEach((b) => (b.disabled = false))
    }
  }

  const render = () => {
    const signedIn = pb.authStore.isValid && pb.authStore.record?.collectionName === 'users'
    document.querySelectorAll('[data-signed-in]').forEach((el) => (el.hidden = !signedIn))
    document.querySelectorAll('[data-signed-out]').forEach((el) => (el.hidden = signedIn))
    document.querySelectorAll('[data-email]').forEach((el) => (el.textContent = signedIn ? pb.authStore.record.email : ''))
    const account = document.querySelector('[data-account]')
    if (account) account.textContent = signedIn ? 'Registered ✓' : 'Register'
  }

  pb.authStore.onChange(render)
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-sign-out]')) pb.authStore.clear()
  })

  window.PocketCon = { pb, esc, message, run }
  render()

  // Refresh a stored login (drops it if the account is gone), then let pages start.
  const ready = () => document.dispatchEvent(new Event('pocketcon:ready'))
  if (pb.authStore.isValid) {
    pb.collection('users')
      .authRefresh()
      .catch(() => pb.authStore.clear())
      .finally(ready)
  } else ready()
})()
