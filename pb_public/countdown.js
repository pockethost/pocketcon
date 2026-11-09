;(() => {
  const el = document.getElementById('countdown')
  if (!el) return
  const target = Date.parse(el.dataset.starts)
  const cells = {}
  el.querySelectorAll('[data-unit]').forEach((b) => (cells[b.dataset.unit] = b))
  const pad = (n) => String(n).padStart(2, '0')

  const tick = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000))
    const d = Math.floor(s / 86400)
    s -= d * 86400
    const h = Math.floor(s / 3600)
    s -= h * 3600
    const m = Math.floor(s / 60)
    s -= m * 60
    cells.d.textContent = d
    cells.h.textContent = pad(h)
    cells.m.textContent = pad(m)
    cells.s.textContent = pad(s)
  }
  tick()
  setInterval(tick, 1000)
})()
