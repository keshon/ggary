/** Keep ticks while suppressing labels that cannot fit; endpoints take priority. */
export function observeSliderLabels(marks: HTMLElement | null | undefined): (() => void) | undefined {
  if (!marks || typeof ResizeObserver === 'undefined') return
  const layout = () => {
    const labels = Array.from(marks.querySelectorAll<HTMLElement>('[data-part="mark-label"]'))
    const ordered = labels.length > 1 ? [labels[0], labels[labels.length - 1], ...labels.slice(1, -1)] : labels
    const occupied: DOMRect[] = []
    for (const label of ordered) {
      const rect = label.getBoundingClientRect()
      const fits = !occupied.some(other => rect.left < other.right + 8 && rect.right + 8 > other.left)
      label.style.visibility = fits ? '' : 'hidden'
      if (fits) occupied.push(rect)
    }
  }
  const resize = new ResizeObserver(layout)
  resize.observe(marks)
  const changes = new MutationObserver(layout)
  changes.observe(marks, { childList: true, subtree: true, characterData: true })
  layout()
  return () => { resize.disconnect(); changes.disconnect() }
}
