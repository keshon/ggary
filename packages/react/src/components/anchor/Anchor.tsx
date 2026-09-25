import { useEffect, useId, useRef, useState, type HTMLAttributes } from 'react'
import { anchorFloatQuery, anchorHrefs, connect, type AnchorItem, type AnchorProps as CoreAnchorProps } from '@ggary/core/anchor'
import { attachAnchorPanel, reactNormalizer, watchMedia, watchScrollSpy } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface AnchorProps extends Omit<CoreAnchorProps, 'id'>, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The folded list starts open. */
  defaultOpen?: boolean
}

/**
 * On-page navigation: links to the page's sections, the one being read
 * marked as the page scrolls. With `float`, folded behind a button at the
 * window's corner that names where the reader is.
 */
export function Anchor(own: AnchorProps) {
  const { label, items, current, onCurrentChange, offset, float, open, defaultOpen = false, onOpenChange, words, ...rest } = useConfigured(own, { words: 'anchor' })
  const id = `gg-anchor-${useId().replace(/:/g, '')}`
  const [read, setRead] = useState<string | null>(items[0]?.href ?? null)
  const [narrow, setNarrow] = useState(false)
  const [kept, setKept] = useState(defaultOpen)
  const floating = float === true || (typeof float === 'number' && narrow)
  const shown = open ?? kept

  const callbacks = useRef({ onCurrentChange, onOpenChange, open })
  callbacks.current = { onCurrentChange, onOpenChange, open }
  const follow = (href: string) => {
    setRead(href)
    callbacks.current.onCurrentChange?.(href)
  }
  const setOpen = (next: boolean) => {
    if (callbacks.current.open === undefined) setKept(next)
    callbacks.current.onOpenChange?.(next)
  }

  const hrefs = anchorHrefs(items).join(' ')
  useEffect(() => watchScrollSpy(document, hrefs.split(' '), { offset, onChange: follow }), [hrefs, offset])
  useEffect(() => watchMedia(document, anchorFloatQuery(float), setNarrow), [float])

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const engaged = floating && shown
  useEffect(() => {
    if (!engaged || !panelRef.current) return
    return attachAnchorPanel(panelRef.current, triggerRef.current, () => setOpen(false))
  }, [engaged])

  const api = connect(
    { id, label, items, words, onCurrentChange: follow, onOpenChange: setOpen },
    { current: current ?? read, floating, open: engaged },
    reactNormalizer
  )

  const list = (entries: AnchorItem[], level: 1 | 2) => (
    <ul {...api.listProps(level)}>
      {entries.map((item) => {
        const parts = api.getItemProps(item, level)
        return (
          <li key={item.href} {...parts.itemProps}>
            <a {...parts.linkProps}>{item.label}</a>
            {parts.sections.length > 0 && list(parts.sections, 2)}
          </li>
        )
      })}
    </ul>
  )

  return (
    <nav {...rest} {...api.rootProps}>
      <div ref={panelRef} {...api.panelProps}>
        {list(items, 1)}
      </div>
      {api.showTrigger && (
        <button ref={triggerRef} {...api.triggerProps}>
          <span {...api.triggerIconProps} />
          <span {...api.triggerLabelProps}>{api.triggerText}</span>
        </button>
      )}
    </nav>
  )
}
