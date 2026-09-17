import { useCallback, type ForwardedRef, type MutableRefObject } from 'react'

/**
 * One callback ref that fills a component's own ref and the one forwarded to
 * it, for components that need their element (to set `indeterminate`, to attach
 * auto-resize) and still hand it to the caller.
 */
export function useMergedRef<T>(own: MutableRefObject<T | null>, forwarded: ForwardedRef<T>) {
  return useCallback(
    (node: T | null) => {
      own.current = node
      if (typeof forwarded === 'function') forwarded(node)
      else if (forwarded) forwarded.current = node
    },
    [own, forwarded]
  )
}
