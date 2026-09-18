import { Fragment, useEffect, useRef } from 'react'
import { hasIndicator, menuFocusTarget, type MenuApi, type MenuItem, type MenuNode, type MenuState, type MenuSubmenuItem } from '@ggary/core/menu'
import { attachPopover, submenuOffsets, focusMenuTarget, revealMenuTarget, type AttachedPopover, type VirtualElement } from '@ggary/core'

export interface MenuContentProps {
  api: MenuApi
  /** The machine's current state, read at the moment an effect runs. */
  getState: () => MenuState
  /** What the menu is anchored to: a Menu's trigger, a Menubar's item. Focus goes back to it on close. */
  reference: () => HTMLElement | null
  /** Where the menu stands when that is not the reference: a context menu stands at the pointer. */
  anchor?: () => Element | VirtualElement | null
  /** A press on the reference closes the menu, as for a context menu. Default false: a trigger toggles. */
  dismissOnReference?: boolean
}

/**
 * The menu panel and every submenu under it. Shared by Menu and Menubar, which
 * differ only in what opens the panel.
 *
 * Passive effects, not layout effects as Popover's: React restores focus to the
 * element that had it before a commit once the commit's layout cleanups have
 * run, so a focus return made from a layout cleanup lands back on the row.
 * Passive effects run after that restore, and still before paint for a click
 * or a key.
 */
export function MenuContent({ api, getState, reference, anchor, dismissOnReference }: MenuContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const attached = useRef<AttachedPopover | null>(null)

  useEffect(() => {
    const content = contentRef.current
    const element = reference()
    if (!api.open || !content || !element) return
    const instance = attachPopover(element, content, {
      placement: getState().placement,
      gutter: 4,
      // Focus goes back to the anchor on close; where it goes while open is
      // the focus target's business, below.
      manageFocus: true,
      onDismiss: (reason) => api.dismiss(reason),
      // Placement is asynchronous and shortens the list: keep the row in view after it.
      onPlaced: () => revealMenuTarget(document, menuFocusTarget(getState())),
      anchor: anchor?.() ?? undefined,
      excludeReference: !dismissOnReference,
    })
    attached.current = instance
    return () => {
      instance.destroy()
      attached.current = null
    }
  }, [api.open])

  useEffect(() => {
    attached.current?.update({ placement: api.placement })
  }, [api.placement])

  // Children's effects run first, so a submenu that just mounted is shown by now.
  useEffect(() => {
    if (api.open) focusMenuTarget(document, api.focusTarget)
  }, [api.open, api.focusTarget?.contentId, api.focusTarget?.itemId])

  return (
    <div ref={contentRef} {...api.contentProps}>
      <Level api={api} nodes={api.nodes} parent={[]} getState={getState} />
    </div>
  )
}

interface LevelProps {
  api: MenuApi
  nodes: MenuNode[]
  parent: number[]
  getState: () => MenuState
}

function Level({ api, nodes, parent, getState }: LevelProps) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === 'separator') return <div key={node.key} {...api.separatorProps} />
        if (node.kind === 'item') {
          return <Row key={node.key} api={api} item={node.item} path={[...parent, node.index]} getState={getState} />
        }
        return (
          <div key={node.key} {...api.getGroupProps(node, parent)}>
            {node.label && <div {...api.getGroupLabelProps(node, parent)}>{node.label}</div>}
            {node.items.map(({ item, index }) => (
              <Row key={item.value} api={api} item={item} path={[...parent, index]} getState={getState} />
            ))}
          </div>
        )
      })}
    </>
  )
}

interface RowProps {
  api: MenuApi
  item: MenuItem
  path: number[]
  getState: () => MenuState
}

function Row({ api, item, path, getState }: RowProps) {
  const props = api.getItemProps(item, path)
  const children = (
    <>
      <span {...api.getItemTextProps()}>{item.label}</span>
      {'shortcut' in item && item.shortcut && <span {...api.getItemShortcutProps()}>{item.shortcut}</span>}
      {hasIndicator(item) && <span {...api.getItemIndicatorProps(item)} />}
      {item.type === 'submenu' && <span {...api.submenuIndicatorProps} />}
    </>
  )
  return (
    <Fragment>
      {props.href ? <a {...props}>{children}</a> : <div {...props}>{children}</div>}
      {item.type === 'submenu' && api.isSubmenuOpen(path) && (
        <Submenu api={api} item={item} path={path} getState={getState} />
      )}
    </Fragment>
  )
}

function Submenu({ api, item, path, getState }: { api: MenuApi; item: MenuSubmenuItem; path: number[]; getState: () => MenuState }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathKey = path.join('-')

  // A submenu is shown for as long as it is rendered.
  useEffect(() => {
    const content = ref.current
    const row = document.getElementById(api.ids.item(path))
    if (!content || !row) return
    const instance = attachPopover(row, content, {
      placement: 'right-start',
      ...submenuOffsets(row, content),
      // The menu is the dismiss layer for the whole tree.
      dismissable: false,
      onDismiss: () => {},
      onPlaced: () => revealMenuTarget(document, menuFocusTarget(getState())),
    })
    focusMenuTarget(document, menuFocusTarget(getState()))
    return () => instance.destroy()
  }, [pathKey])

  return (
    <div ref={ref} {...api.getSubmenuProps(path)}>
      <Level api={api} nodes={api.nodesOf(item)} parent={path} getState={getState} />
    </div>
  )
}
