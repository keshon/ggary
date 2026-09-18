/**
 * Which rows to draw, and where, for a list far taller than a browser allows.
 *
 * 700,000 rows of 32px is 22.4 million pixels. Firefox caps an element's height
 * near 17.9 million and Chrome near 33.5 million; past the cap the scrollbar
 * lies and the last rows are unreachable. So above MAX_SCROLL_HEIGHT the scroll
 * range is SCALED: the scrollbar covers the whole list, and a pixel of scroll
 * stands for more than a pixel of rows. Rows are still drawn at their real
 * height; only the mapping from scrollTop to "which row is at the top" changes.
 *
 * Rows have one fixed height. Variable heights would need every row measured
 * to know where row 500,000 is — the trap most virtual tables fall into.
 */

/** Comfortably under every browser's cap. */
export const MAX_SCROLL_HEIGHT = 8_000_000

export interface ViewportInput {
  scrollTop: number
  viewportHeight: number
  rowHeight: number
  total: number
  /** Rows drawn beyond each edge, so a fast wheel does not show a gap. */
  overscan?: number
}

export interface RowWindow {
  /** The first row to draw. */
  start: number
  /** One past the last row to draw. */
  end: number
  /** The height of the scrolling content. */
  scrollHeight: number
  /** Draw row `i` at `i * rowHeight + shift` inside the scrolling content. */
  shift: number
  /** Content pixels per scroll pixel: 1 until the list outgrows the cap. */
  ratio: number
}

const scale = (total: number, rowHeight: number, viewportHeight: number) => {
  const contentHeight = total * rowHeight
  if (contentHeight <= MAX_SCROLL_HEIGHT) return { contentHeight, scrollHeight: contentHeight, ratio: 1 }
  const realMax = Math.max(0, contentHeight - viewportHeight)
  const scrollMax = Math.max(1, MAX_SCROLL_HEIGHT - viewportHeight)
  return { contentHeight, scrollHeight: MAX_SCROLL_HEIGHT, ratio: realMax / scrollMax }
}

export function rowWindow(input: ViewportInput): RowWindow {
  const { viewportHeight, rowHeight, total, overscan = 6 } = input
  const { scrollHeight, ratio, contentHeight } = scale(total, rowHeight, viewportHeight)
  const maxScroll = Math.max(0, scrollHeight - viewportHeight)
  const scrollTop = Math.min(Math.max(0, input.scrollTop), maxScroll)
  // Where the top of the view is in the real, unscaled list.
  const realTop = Math.min(scrollTop * ratio, Math.max(0, contentHeight - viewportHeight))
  const first = Math.floor(realTop / rowHeight)
  const last = Math.ceil((realTop + viewportHeight) / rowHeight)
  return {
    start: Math.max(0, first - overscan),
    end: Math.min(total, last + overscan),
    scrollHeight,
    shift: scrollTop - realTop,
    ratio,
  }
}

export type RowAlign = 'start' | 'end' | 'nearest'

/**
 * The scrollTop that brings a row into view — for the keyboard, and for
 * "go to row". `nearest` does not move a row that is already fully visible.
 */
export function scrollTopForRow(
  index: number,
  input: Omit<ViewportInput, 'overscan'>,
  align: RowAlign = 'nearest'
): number {
  const { viewportHeight, rowHeight, total } = input
  const { scrollHeight, ratio, contentHeight } = scale(total, rowHeight, viewportHeight)
  const maxScroll = Math.max(0, scrollHeight - viewportHeight)
  const realTop = Math.min(input.scrollTop * ratio, Math.max(0, contentHeight - viewportHeight))
  const rowTop = index * rowHeight
  const rowBottom = rowTop + rowHeight

  let target: number
  if (align === 'start') target = rowTop
  else if (align === 'end') target = rowBottom - viewportHeight
  else if (rowTop < realTop) target = rowTop
  else if (rowBottom > realTop + viewportHeight) target = rowBottom - viewportHeight
  else return input.scrollTop

  const clampedReal = Math.min(Math.max(0, target), Math.max(0, contentHeight - viewportHeight))
  // Rounding up to the next scroll pixel could skip past the row when scaled;
  // the floor keeps the row's top at or below the view's top edge.
  return Math.min(maxScroll, Math.max(0, ratio === 1 ? clampedReal : Math.floor(clampedReal / ratio)))
}
