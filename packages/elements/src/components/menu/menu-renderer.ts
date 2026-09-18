import { hasIndicator, menuFocusTarget, type MenuApi, type MenuItem, type MenuNode, type MenuState } from '@ggary/core/menu'
import {
  attachPopover,
  submenuOffsets,
  focusMenuTarget,
  revealMenuTarget,
  type AttachedPopover,
  type DomProps,
  type VirtualElement,
} from '@ggary/core'
import { h, reconcileChildren, spread } from '../../spread'

type Api = MenuApi<DomProps>

/**
 * The menu panel and every submenu under it, for <gg-menu> and <gg-menubar>,
 * which differ only in what opens the panel. The vanilla counterpart of
 * MenuContent in React and Svelte.
 *
 * Rows are reused by their path and value, so replacing the items under an
 * open menu — the owner answering a checkbox — keeps the focused row in place.
 */
export class MenuRenderer {
  readonly content: HTMLDivElement = h('div')

  #nodes = new Map<string, HTMLElement>()
  #root: AttachedPopover | null = null
  #submenus = new Map<string, AttachedPopover>()

  constructor(
    private readonly getState: () => MenuState,
    private readonly reference: () => HTMLElement | null,
    /** Where to stand when that is not the reference, and whether a press on the reference closes: a context menu's. */
    private readonly place: { anchor?: () => Element | VirtualElement | null; dismissOnReference?: boolean } = {}
  ) {}

  render(api: Api): void {
    const state = this.getState()
    spread(this.content, api.contentProps)
    this.#renderLevel(api, this.content, api.nodes, [], new Map())

    const reference = this.reference()
    if (state.open && !this.#root && reference) {
      this.#root = attachPopover(reference, this.content, {
        placement: state.placement,
        gutter: 4,
        // Focus goes back to the anchor on close; while open it follows the focus target.
        manageFocus: true,
        onDismiss: (reason) => api.dismiss(reason),
        // Placement is asynchronous and shortens the list: keep the row in view after it.
        onPlaced: () => revealMenuTarget(document, menuFocusTarget(this.getState())),
        anchor: this.place.anchor?.() ?? undefined,
        excludeReference: !this.place.dismissOnReference,
      })
    } else if (!state.open && this.#root) {
      this.#closeSubmenus(new Set())
      this.#root.destroy()
      this.#root = null
    } else {
      this.#root?.update({ placement: state.placement })
    }

    if (state.open) {
      this.#syncSubmenus(api)
      focusMenuTarget(document, menuFocusTarget(state))
    }
  }

  destroy(): void {
    this.#closeSubmenus(new Set())
    this.#root?.destroy()
    this.#root = null
  }

  /** Show every open submenu, parents first, and hide the ones that closed. */
  #syncSubmenus(api: Api): void {
    const { path } = this.getState()
    const open = new Set<string>()
    for (let depth = 1; depth < path.length; depth++) {
      const at = path.slice(0, depth)
      const key = at.join('-')
      open.add(key)
      if (this.#submenus.has(key)) continue
      const row = document.getElementById(api.ids.item(at))
      const element = document.getElementById(api.ids.content(at))
      if (!row || !element) continue
      this.#submenus.set(
        key,
        attachPopover(row, element, {
          placement: 'right-start',
          ...submenuOffsets(row, element),
          // The menu is the dismiss layer for the whole tree.
          dismissable: false,
          onDismiss: () => {},
          onPlaced: () => revealMenuTarget(document, menuFocusTarget(this.getState())),
        })
      )
    }
    this.#closeSubmenus(open)
  }

  #closeSubmenus(keep: Set<string>): void {
    for (const [key, popover] of this.#submenus) {
      if (keep.has(key)) continue
      popover.destroy()
      this.#submenus.delete(key)
    }
  }

  #renderLevel(api: Api, parent: HTMLElement, nodes: MenuNode[], at: number[], next: Map<string, HTMLElement>): void {
    const previous = this.#nodes
    const take = (key: string, tag: 'div' | 'a' | 'span'): HTMLElement => {
      const existing = previous.get(key)
      const element = existing && existing.localName === tag ? existing : document.createElement(tag)
      next.set(key, element)
      return element
    }
    const prefix = at.length ? `${at.join('-')}/` : ''

    const row = (item: MenuItem, index: number): HTMLElement[] => {
      const path = [...at, index]
      const props = api.getItemProps(item, path)
      const key = `${prefix}item:${item.value}`
      const element = take(key, 'href' in props.attrs ? 'a' : 'div')
      spread(element, props)

      const text = take(`${key}:text`, 'span')
      spread(text, api.getItemTextProps())
      if (text.textContent !== item.label) text.textContent = item.label
      const parts = [text]

      if ('shortcut' in item && item.shortcut) {
        const shortcut = take(`${key}:shortcut`, 'span')
        spread(shortcut, api.getItemShortcutProps())
        if (shortcut.textContent !== item.shortcut) shortcut.textContent = item.shortcut
        parts.push(shortcut)
      }
      if (hasIndicator(item)) {
        const indicator = take(`${key}:indicator`, 'span')
        spread(indicator, api.getItemIndicatorProps(item))
        parts.push(indicator)
      }
      if (item.type === 'submenu') {
        const chevron = take(`${key}:submenu-indicator`, 'span')
        spread(chevron, api.submenuIndicatorProps)
        parts.push(chevron)
      }
      reconcileChildren(element, parts)

      if (item.type !== 'submenu' || !api.isSubmenuOpen(path)) return [element]
      // Right after its row, inside the menu: a press inside it is inside the menu.
      const submenu = take(`${key}:submenu`, 'div')
      spread(submenu, api.getSubmenuProps(path))
      this.#renderLevel(api, submenu, api.nodesOf(item), path, next)
      return [element, submenu]
    }

    const children = nodes.flatMap((node) => {
      if (node.kind === 'item') return row(node.item, node.index)
      if (node.kind === 'separator') {
        const separator = take(`${prefix}${node.key}`, 'div')
        spread(separator, api.separatorProps)
        return [separator]
      }
      const group = take(`${prefix}${node.key}`, 'div')
      spread(group, api.getGroupProps(node, at))
      const rows: HTMLElement[] = []
      if (node.label) {
        const label = take(`${prefix}${node.key}:label`, 'div')
        spread(label, api.getGroupLabelProps(node, at))
        if (label.textContent !== node.label) label.textContent = node.label
        rows.push(label)
      }
      for (const { item, index } of node.items) rows.push(...row(item, index))
      reconcileChildren(group, rows)
      return [group]
    })

    reconcileChildren(parent, children)
    if (at.length === 0) this.#nodes = next
  }
}
