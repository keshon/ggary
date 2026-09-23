import { useId, useState, type ReactNode } from 'react'
import { connect, type ThinkingProps as CoreThinkingProps, type ThinkingWords } from '@ggary/core/thinking'
import { reactNormalizer } from '@ggary/core'
import { Caret } from '../states'

export interface ThinkingProps extends Omit<CoreThinkingProps, 'id' | 'open'> {
  /** The reasoning. */
  children?: ReactNode
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  /** Default false: the answer is what was asked for. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  words?: ThinkingWords
}

/** What the machine worked out before it answered, collapsed by default. */
export function Thinking(props: ThinkingProps) {
  const { children, open, defaultOpen = false, onOpenChange, streaming, duration, locale, disabled, words } = props
  const id = `gg-thinking-${useId().replace(/:/g, '')}`
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isOpen = open ?? uncontrolled

  const api = connect(
    { id, open: isOpen, streaming, duration, locale, disabled },
    reactNormalizer,
    () => {
      if (open === undefined) setUncontrolled(!isOpen)
      onOpenChange?.(!isOpen)
    },
    words
  )

  return (
    <div {...api.rootProps}>
      <button {...api.triggerProps}>
        <span {...api.indicatorProps} />
        <span {...api.labelProps}>{api.label}</span>
      </button>
      <div {...api.contentProps}>
        <div {...api.bodyProps}>
          {children}
          {api.showCaret && <Caret />}
        </div>
      </div>
    </div>
  )
}
