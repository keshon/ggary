import { useCallback, useEffect, useRef, useState } from 'react'
import { COPY_IDLE, createCopier, type Copier, type CopyRequest, type CopyState } from '@ggary/core/code'

/**
 * One copy button's state, for CodeBlock and Copyable. The copier is made in
 * an effect so Strict Mode's second mount gets a live one, and destroyed on
 * unmount so no timer answers into a component that has gone.
 */
export function useCopier() {
  const [state, setState] = useState<CopyState>(COPY_IDLE)
  const copier = useRef<Copier | null>(null)
  useEffect(() => {
    const made = createCopier(setState)
    copier.current = made
    return () => {
      made.destroy()
      copier.current = null
    }
  }, [])
  const copy = useCallback((text: string, request: CopyRequest) => {
    void copier.current?.copy(text, request)
  }, [])
  return [state, copy] as const
}
