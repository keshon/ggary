import { useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * Base UI exposes inputRef, but not a render slot for its submission input.
 * Keep GGary anatomy/ARIA on that input for refs and form summaries. This only
 * owns attributes: Base UI keeps checked state, indeterminate, focus and events.
 */
export function useChoiceInputMetadata(ref: RefObject<HTMLInputElement | null>, attributes: Record<string, string | undefined>) {
  const previous = useRef<string[]>([])
  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    for (const key of previous.current) if (!(key in attributes)) input.removeAttribute(key)
    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined) input.removeAttribute(key)
      else input.setAttribute(key, value)
    }
    previous.current = Object.keys(attributes)
  })
}
