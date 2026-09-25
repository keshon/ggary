import { useEffect, useRef, type ReactNode } from 'react'
import { stageDrop } from '../data/upload'

/**
 * A page's states on show as it loads: once the Upload inside is there, a drop
 * of `files` is staged on it. Once only — StrictMode runs the effect twice.
 */
export function Staged({ files, children }: { files: () => File[] | Promise<File[]>; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null)
  const staged = useRef(false)
  useEffect(() => {
    if (staged.current) return
    staged.current = true
    requestAnimationFrame(async () => {
      const list = await files()
      if (host.current) stageDrop(host.current, list)
    })
  }, [files])
  return <div ref={host}>{children}</div>
}
