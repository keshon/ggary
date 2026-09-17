import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { connect, type ToolbarProps as CoreToolbarProps } from '@ggary/core/toolbar'
import { attachToolbarKeys, reactNormalizer } from '@ggary/core'

export interface ToolbarProps extends CoreToolbarProps, HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Toolbar({ label, orientation = 'horizontal', children, ...rest }: ToolbarProps) {
  const api = connect({ label, orientation }, reactNormalizer)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!api.managed || !root.current) return
    return attachToolbarKeys(root.current, orientation)
  }, [api.managed, orientation])

  return (
    <div ref={root} {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** A line between meaningful groups of tools. */
export function ToolbarSeparator() {
  const api = connect({}, reactNormalizer)
  return <span {...api.separatorProps} />
}

/** One per strip: everything after it goes to the far edge. */
export function ToolbarSpacer() {
  const api = connect({}, reactNormalizer)
  return <span {...api.spacerProps} />
}
