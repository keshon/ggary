/** The FileDrop inside `host` with a file held over it, as a person dragging one would leave it: the zone's drag state, on show as the page loads. */
const held = new WeakSet<HTMLElement>()
export function holdFileOver(host: HTMLElement | null) {
  if (!host || held.has(host)) return
  held.add(host)
  // Once the zone listens: it starts to after the first paint, so two frames on.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const zone = host.querySelector<HTMLElement>('[data-scope="file-drop"][data-part="root"]')
    if (!zone) return
    const transfer = new DataTransfer()
    transfer.items.add(new File(['id,company\n214,Acme Labs\n'], 'leads-2026-09.csv', { type: 'text/csv' }))
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }))
  }))
}
