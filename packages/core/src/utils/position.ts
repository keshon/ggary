import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'

/**
 * `core` has exactly one runtime dependency, and this is why.
 *
 * The rule is "zero *framework* dependencies", not "zero dependencies". Flip /
 * shift against scroll containers, virtual elements and iframes is a solved
 * problem; reimplementing it is a multi-month detour that ends in a worse
 * version of Floating UI.
 */
export interface PositionOptions {
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  gutter?: number
  /** Match the popover's min-width to the trigger. What a <select> does. */
  sameWidth?: boolean
}

export function attachPositioner(
  reference: HTMLElement,
  floating: HTMLElement,
  { placement = 'bottom-start', gutter = 4, sameWidth = true }: PositionOptions = {}
): () => void {
  return autoUpdate(reference, floating, () => {
    void computePosition(reference, floating, {
      placement,
      strategy: 'absolute',
      middleware: [
        offset(gutter),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        size({
          padding: 8,
          apply({ rects, availableHeight, elements }) {
            const style = (elements.floating as HTMLElement).style
            if (sameWidth) style.minWidth = `${rects.reference.width}px`
            style.setProperty('--gg-available-height', `${Math.max(120, availableHeight)}px`)
          },
        }),
      ],
    }).then(({ x, y, placement: resolved }) => {
      floating.dataset.placement = resolved
      Object.assign(floating.style, { transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)` })
    })
  })
}
