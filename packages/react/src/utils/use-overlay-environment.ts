import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'
import { useConfig } from '../components/config-provider'

/** Copy local design tokens across a portal and retain the nearest overlay owner. */
export function useOverlayEnvironment(reference: RefObject<HTMLElement | null>, open: boolean) {
  const config = useConfig()
  const [environment, setEnvironment] = useState<{ container?: HTMLElement; style: CSSProperties }>({ style: {} })
  useLayoutEffect(() => {
    if (!open || !reference.current) return
    const computed = getComputedStyle(reference.current)
    const style: Record<string, string> = { direction: config.dir ?? computed.direction }
    for (const key of Array.from(computed)) if (key.startsWith('--')) style[key] = computed.getPropertyValue(key)
    setEnvironment({ style,
      container: reference.current.closest<HTMLElement>('[data-backend="base-ui"]:is([data-scope="dialog"][data-part="layer"], [data-scope="popover"][data-part="positioner"])') ?? undefined })
  }, [reference, open, config])
  return { ...environment, mode: config.mode, dir: config.dir, locale: config.locale }
}
