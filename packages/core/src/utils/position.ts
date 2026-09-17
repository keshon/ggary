import { autoUpdate, computePosition, flip, offset, shift, size, type Placement } from '@floating-ui/dom'

/**
 * `core` has exactly one runtime dependency, and this is why.
 *
 * The rule is "zero *framework* dependencies", not "zero dependencies". Flip /
 * shift against scroll containers, virtual elements and iframes is a solved
 * problem; reimplementing it is a multi-month detour that ends in a worse
 * version of Floating UI.
 */
export type { Placement }

export interface PositionOptions {
  placement?: Placement
  gutter?: number
  /** Match the floating element's min-width to the reference. What a <select> does. */
  sameWidth?: boolean
  /**
   * `fixed` for anything in the top layer — a popover is positioned against the
   * viewport, whatever its DOM parent. `absolute` for a floating element that
   * lives in its parent's flow.
   */
  strategy?: 'absolute' | 'fixed'
  /**
   * After each placement, once the size limits are on the element. Placement is
   * asynchronous, so anything measured against those limits — keeping a
   * highlighted row inside a list that just got shorter — has to wait for this.
   */
  onPlaced?: () => void
}

export function attachPositioner(
  reference: HTMLElement,
  floating: HTMLElement,
  { placement = 'bottom-start', gutter = 4, sameWidth = true, strategy = 'absolute', onPlaced }: PositionOptions = {}
): () => void {
  return autoUpdate(reference, floating, () => {
    void computePosition(reference, floating, {
      placement,
      strategy,
      middleware: [
        offset(gutter),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        size({
          padding: 8,
          apply({ rects, availableHeight, availableWidth, elements }) {
            const style = (elements.floating as HTMLElement).style
            if (sameWidth) style.minWidth = `${rects.reference.width}px`
            style.setProperty('--gg-available-height', `${Math.max(120, availableHeight)}px`)
            style.setProperty('--gg-available-width', `${Math.max(120, availableWidth)}px`)
          },
        }),
      ],
    }).then(({ x, y, placement: resolved }) => {
      floating.dataset.placement = resolved
      Object.assign(floating.style, { transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)` })
      onPlaced?.()
    })
  })
}
