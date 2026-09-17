import { Dialog, type DialogProps } from './Dialog'

export interface SheetProps extends Omit<DialogProps, 'placement'> {
  /** The edge it stands at. Logical: `end` is the right in a left-to-right page. Default `end`. */
  side?: 'start' | 'end'
}

/**
 * A full-height panel at the edge of the screen. The same dialog, with the same
 * parts, focus, Escape and scroll lock — a different layout rather than a
 * different component (Instrument's `inst-sheet`).
 */
export function Sheet({ side = 'end', ...props }: SheetProps) {
  return <Dialog {...props} placement={side} />
}
