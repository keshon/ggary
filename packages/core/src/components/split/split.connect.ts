import type { Dict, Normalizer } from '../../types'
import { splitAnatomy as anatomy } from './split.anatomy'
import type { SplitEvent, SplitState } from './split.types'

export const splitIds = (id: string) => ({
  root: id,
  start: `${id}-start`,
  end: `${id}-end`,
  separator: `${id}-separator`,
})

export interface SplitConnectOptions {
  /** The separator's name, required: "Resize the lead list". */
  label: string
  /** The least the other pane keeps, in px, however far the separator is dragged. Default 200. */
  restMin?: number
}

/**
 * Two panes and the line between them, which can be dragged — the window
 * splitter of the ARIA practices. The separator is a focusable `separator`
 * with a value: the primary pane's size in pixels, between its minimum and
 * its maximum. Arrow keys move it (Shift, four steps), Home and End go to the
 * bounds, Enter folds a collapsible pane away and back, and a double click
 * puts it where it started.
 *
 * The size is a custom property on the frame, `--gg-split-size`; the
 * structure layer gives it to the primary pane, and the other pane takes the
 * rest without falling under `--gg-split-rest-min`.
 */
export function connect<T = Dict>(state: SplitState, send: (event: SplitEvent) => void, normalize: Normalizer<T>, options: SplitConnectOptions) {
  const ids = splitIds(state.id)
  const restMin = options.restMin ?? 200
  const horizontal = state.orientation === 'horizontal'
  const primaryId = state.primary === 'start' ? ids.start : ids.end

  /** What the frame leaves for the primary pane once the other keeps its minimum. */
  const limitFrom = (separator: HTMLElement) => {
    const root = separator.parentElement
    // A frame the structure layer does not lay out (no stylesheet) sets the
    // panes one under the other whatever the orientation: it bounds nothing.
    if (!root || !getComputedStyle(root).display.includes('flex')) return undefined
    const frame = root.getBoundingClientRect()
    const own = separator.getBoundingClientRect()
    const total = horizontal ? frame.width : frame.height
    // No layout (a test environment without one): no limit beyond the pane's own.
    if (total === 0) return undefined
    return total - restMin - (horizontal ? own.width : own.height)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const separator = event.currentTarget as HTMLElement
    const rtl = horizontal && getComputedStyle(separator).direction === 'rtl'
    // Towards the far side of the primary pane grows it.
    const forward = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const backward = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    const grow = state.primary === 'start' ? forward : backward
    const shrink = state.primary === 'start' ? backward : forward
    const step = state.step * (event.shiftKey ? 4 : 1)
    switch (event.key) {
      case grow:
        send({ type: 'STEP', delta: step, limit: limitFrom(separator) })
        break
      case shrink:
        send({ type: 'STEP', delta: -step, limit: limitFrom(separator) })
        break
      case 'Home':
        send({ type: 'TO_MIN' })
        break
      case 'End':
        send({ type: 'TO_MAX', limit: limitFrom(separator) })
        break
      case 'Enter':
        if (!state.collapsible) return
        send({ type: 'TOGGLE_COLLAPSE' })
        break
      default:
        return
    }
    event.preventDefault()
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    const separator = event.currentTarget as HTMLElement
    const root = separator.parentElement
    if (!root) return
    event.preventDefault()
    separator.focus({ preventScroll: true })
    const rtl = horizontal && getComputedStyle(separator).direction === 'rtl'
    try {
      separator.setPointerCapture(event.pointerId)
    } catch {
      // A synthetic pointer has nothing to capture.
    }
    root.setAttribute('data-dragging', '')

    // How far a point lies into the frame, measured from the primary pane's side.
    const depth = (x: number, y: number) => {
      const frame = root.getBoundingClientRect()
      const fromStart = horizontal ? (rtl ? frame.right - x : x - frame.left) : y - frame.top
      return state.primary === 'end' ? (horizontal ? frame.width : frame.height) - fromStart : fromStart
    }
    // Where the separator's middle stands from the pane's edge — its margins
    // and width are the theme's — so the line stays under the pointer.
    const own = separator.getBoundingClientRect()
    const offset = depth(own.left + own.width / 2, own.top + own.height / 2) - (state.collapsed ? 0 : state.size)
    const sizeAt = (move: PointerEvent) => depth(move.clientX, move.clientY) - offset
    const onMove = (move: PointerEvent) => send({ type: 'SET_SIZE', size: sizeAt(move), limit: limitFrom(separator), reason: 'pointer' })
    const onUp = () => {
      root.removeAttribute('data-dragging')
      separator.removeEventListener('pointermove', onMove)
      separator.removeEventListener('pointerup', onUp)
      separator.removeEventListener('pointercancel', onUp)
    }
    separator.addEventListener('pointermove', onMove)
    separator.addEventListener('pointerup', onUp)
    separator.addEventListener('pointercancel', onUp)
  }

  const pane = (side: 'start' | 'end') => {
    const primary = state.primary === side
    return normalize({
      ...anatomy.attrs('pane'),
      id: side === 'start' ? ids.start : ids.end,
      'data-pane': side,
      'data-primary': primary ? '' : undefined,
      // Folded away, and out of the reading order and the tab order with it.
      hidden: primary && state.collapsed ? true : undefined,
    })
  }

  return {
    ids,
    size: state.size,
    collapsed: state.collapsed,
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'data-orientation': state.orientation,
      'data-primary': state.primary,
      'data-collapsed': state.collapsed ? '' : undefined,
      style: { '--gg-split-size': `${state.size}px`, '--gg-split-rest-min': `${restMin}px` },
    }),
    startPaneProps: pane('start'),
    endPaneProps: pane('end'),
    separatorProps: normalize({
      ...anatomy.attrs('separator'),
      id: ids.separator,
      role: 'separator',
      tabIndex: 0,
      'aria-label': options.label,
      // The separator's own line: panes side by side are parted by a vertical one.
      'aria-orientation': horizontal ? 'vertical' : 'horizontal',
      'aria-controls': primaryId,
      'aria-valuenow': state.collapsed ? 0 : state.size,
      'aria-valuemin': state.collapsible ? 0 : state.min,
      'aria-valuemax': state.max,
      'data-orientation': state.orientation,
      onKeyDown,
      onPointerDown,
      onDoubleClick: () => send({ type: 'RESET' }),
    }),
    handleProps: normalize({ ...anatomy.attrs('handle'), 'aria-hidden': 'true' }),
  }
}

export type SplitApi<T = Dict> = ReturnType<typeof connect<T>>
