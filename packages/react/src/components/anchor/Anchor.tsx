import { Popover as Primitive } from '@base-ui/react/popover'
import { useEffect, useId, useRef, useState, type HTMLAttributes } from 'react'
import { anchorFloatQuery, anchorHrefs, connect, type AnchorItem, type AnchorProps as CoreAnchorProps } from '@ggary/core/anchor'
import { reactNormalizer, watchMedia, watchScrollSpy } from '@ggary/core'
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

  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const engaged = floating && shown

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

  const { onClick: _toggle, ...triggerProps } = api.triggerProps
  return (
    <nav {...rest} {...api.rootProps} ref={setPortalHost}>
      {floating ? <Primitive.Root open={engaged} modal={false} triggerId={`${id}-trigger`}
        onOpenChange={next => setOpen(next)}>
        <Primitive.Trigger {...triggerProps} id={`${id}-trigger`} ref={triggerRef}>
          <span {...api.triggerIconProps} />
          <span {...api.triggerLabelProps}>{api.triggerText}</span>
        </Primitive.Trigger>
        {portalHost && <Primitive.Portal container={portalHost} keepMounted>
        <Primitive.Positioner side="top" align="end" sideOffset={8} positionMethod="fixed">
          <Primitive.Popup {...api.panelProps} aria-label={label}>
            {list(items, 1)}
          </Primitive.Popup>
        </Primitive.Positioner>
        </Primitive.Portal>}
      </Primitive.Root> : <div {...api.panelProps}>{list(items, 1)}</div>}
    </nav>
  )
}
