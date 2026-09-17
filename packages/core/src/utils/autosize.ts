export interface AutosizeOptions {
  /** Grow up to this many lines, then scroll. Absent, grow without limit. */
  maxRows?: number
}

export interface Autosize {
  /** Re-measure. Call after the value changes from code: that fires no `input` event. */
  update(): void
  setOptions(options: AutosizeOptions): void
  destroy(): void
}

const px = (value: string) => parseFloat(value) || 0

/*
 * A height is only right for the metrics it was measured under, and most of
 * the ways those change fire nothing on the textarea itself: a theme, mode or
 * density switch (attributes on <html>), a stylesheet added or swapped, a web
 * font finishing loading after the first measure. A stale height either clips
 * text under `overflow: hidden` or leaves a gap.
 *
 * One watcher serves every live instance, and re-measures them together in a
 * microtask — after the whole switch has been applied, and in a background tab
 * too, where animation frames do not run. A change on a subtree (a `data-*` on
 * a panel) is not watched: call `update()` for that.
 */
const live = new Set<() => void>()
let unwatch: (() => void) | null = null

function watchPage(resize: () => void): () => void {
  live.add(resize)
  if (!unwatch && typeof MutationObserver !== 'undefined') {
    let pending = false
    const all = () => {
      if (pending) return
      pending = true
      queueMicrotask(() => {
        pending = false
        live.forEach((fn) => fn())
      })
    }
    const observer = new MutationObserver(all)
    observer.observe(document.documentElement, { attributes: true })
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.addEventListener?.('loadingdone', all)
    unwatch = () => {
      observer.disconnect()
      fonts?.removeEventListener?.('loadingdone', all)
    }
  }
  return () => {
    live.delete(resize)
    if (live.size === 0) {
      unwatch?.()
      unwatch = null
    }
  }
}

/**
 * Size a textarea to its content, from its own `rows` (and any theme
 * min-height) up to `maxRows` lines.
 *
 * JS, not `field-sizing: content`: that property has no max-rows of its own and
 * is missing from part of the browsers a kit has to support, and a textarea that
 * grows in one browser and not another is a layout bug in the other.
 *
 * The measure is the classic one — collapse to `height: auto`, read
 * `scrollHeight` — because it is the only one that also lets a textarea SHRINK
 * when text is deleted. Collapsing makes the floor free: an empty textarea's
 * scrollHeight is its `rows` and min-height, not zero.
 */
export function attachAutosize(el: HTMLTextAreaElement, options: AutosizeOptions = {}): Autosize {
  let maxRows = options.maxRows

  const resize = () => {
    const style = getComputedStyle(el)
    const padding = px(style.paddingTop) + px(style.paddingBottom)
    const border = px(style.borderTopWidth) + px(style.borderBottomWidth)

    el.style.height = 'auto'
    // scrollHeight counts padding and never the border.
    let inner = el.scrollHeight - padding
    let overflow = 'hidden'

    if (maxRows && maxRows > 0) {
      const lineHeight = px(style.lineHeight) || px(style.fontSize) * 1.2
      const max = lineHeight * maxRows
      if (inner > max) {
        inner = max
        overflow = 'auto'
      }
    }

    const outer = style.boxSizing === 'border-box' ? inner + padding + border : inner
    el.style.height = `${outer}px`
    // Hidden while it fits: a scrollbar that flashes in for one frame before
    // the height catches up also narrows the text and re-wraps it.
    el.style.overflowY = overflow
  }

  // A width change re-wraps the text, so it changes the height too. Heights
  // this function sets are ignored, or the observer would feed itself.
  let width = el.clientWidth
  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (el.clientWidth === width) return
          width = el.clientWidth
          resize()
        })

  el.addEventListener('input', resize)
  observer?.observe(el)
  const stopWatching = watchPage(resize)
  resize()

  return {
    update: resize,
    setOptions(next) {
      maxRows = next.maxRows
      resize()
    },
    destroy() {
      el.removeEventListener('input', resize)
      observer?.disconnect()
      stopWatching()
      el.style.removeProperty('height')
      el.style.removeProperty('overflow-y')
    },
  }
}
