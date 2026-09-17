import { useEffect, useReducer, useRef, type RefObject } from 'react'
import { onFormReset } from '@ggary/core'

/**
 * Resync with the DOM after the enclosing form is reset.
 *
 * A native reset rewrites values and checked states without an event, so React
 * never hears of it. `onReset` puts uncontrolled state back to its default;
 * then the component re-renders regardless, which also puts a CONTROLLED value
 * back over the DOM — the owner's state wins, as it does for any controlled
 * input. The form is looked up once, at mount, from `ref`.
 */
export function useFormReset(ref: RefObject<Element | null>, onReset: () => void = () => {}) {
  const callback = useRef(onReset)
  callback.current = onReset
  const [, rerender] = useReducer((n: number) => n + 1, 0)

  useEffect(
    () =>
      onFormReset(ref.current, () => {
        callback.current()
        rerender()
      }),
    [ref]
  )
}
