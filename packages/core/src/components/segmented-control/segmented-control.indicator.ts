/**
 * Keeps the visual selection plate aligned with the checked native radio.
 * Geometry stays outside the component APIs: themes consume the two custom
 * properties and both framework adapters share this one observer.
 */
export function observeSegmentedIndicator(root: HTMLElement) {
  const update = () => {
    const selected = root.querySelector<HTMLElement>(':scope > [data-part="item"][data-state="checked"]')
    if (!selected) {
      root.removeAttribute('data-indicator-ready')
      return
    }

    const rootBox = root.getBoundingClientRect()
    const itemBox = selected.getBoundingClientRect()
    root.style.setProperty('--segmented-indicator-x', `${itemBox.left - rootBox.left}px`)
    root.style.setProperty('--segmented-indicator-width', `${itemBox.width}px`)
    root.setAttribute('data-indicator-ready', '')
  }

  const resize = new ResizeObserver(update)
  resize.observe(root)
  for (const item of root.querySelectorAll<HTMLElement>(':scope > [data-part="item"]')) resize.observe(item)

  const mutations = new MutationObserver(update)
  mutations.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state'] })
  update()

  return () => {
    resize.disconnect()
    mutations.disconnect()
  }
}
