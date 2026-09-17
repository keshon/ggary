import {
  connect,
  createMenuMachine,
  hasIndicator,
  menuHighlightedId,
  type MenuApi,
  type MenuEntry,
  type MenuEvent,
  type MenuItem,
  type MenuPlacement,
  type MenuState,
} from '@ggary/core/menu'
import { attachPopover, domNormalizer, focusMenuItem, scrollIntoViewIfNeeded, uid, type AttachedPopover, type DomProps, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'
import { slottedTrigger } from '../popover/popover.element'

type Api = MenuApi<DomProps>

/** Put exactly these children in this order, touching nothing that is already in place. */
function syncChildren(parent: Element, children: Element[]): void {
  const current = parent.children
  const same = current.length === children.length && children.every((child, index) => current[index] === child)
  // Only when something moved: removing the focused item, even to put it back,
  // would drop focus to <body>.
  if (!same) parent.replaceChildren(...children)
}

/**
 * A menu button:
 *
 *   <gg-menu label="Row actions">
 *     <gg-button slot="trigger"><button>Actions</button></gg-button>
 *   </gg-menu>
 *   menu.items = [{ value: 'edit', label: 'Edit' }, { type: 'separator' }, …]
 *
 * Items are data, as Select's are: the `items` property, or a JSON `items`
 * attribute for a page that cannot set properties. Attributes: open, placement,
 * label, keep-open. Methods: show(), close(), toggle(). Events: itemselect
 * ({ value, item, checked? }), openchange ({ open, reason }).
 */
export class GgMenuElement extends HTMLElement {
  static observedAttributes = ['open', 'placement', 'label', 'keep-open', 'items']

  #machine: Machine<MenuState, MenuEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #attached: AttachedPopover | null = null
  #reflecting = false
  #items: MenuEntry[] = []

  #trigger: HTMLElement | null = null
  #content: HTMLDivElement | null = null
  /** Rendered rows and groups by key, so a new items array reuses what it can. */
  #nodes = new Map<string, HTMLElement>()

  get items(): MenuEntry[] {
    return this.#items
  }
  set items(next: MenuEntry[]) {
    this.#items = next ?? []
    this.#machine?.send({ type: 'SYNC_ITEMS', items: this.#items })
  }

  get open(): boolean {
    return this.#machine?.getState().open ?? this.hasAttribute('open')
  }
  set open(next: boolean) {
    this.toggleAttribute('open', next)
  }

  show(): void {
    this.#machine?.send({ type: 'OPEN', reason: 'api' })
  }
  close(): void {
    this.#machine?.send({ type: 'CLOSE', reason: 'api' })
  }
  toggle(): void {
    this.#machine?.send({ type: 'TOGGLE', reason: 'api' })
  }

  connectedCallback(): void {
    if (!this.#machine) {
      if (this.#items.length === 0) this.#items = this.#parseItems()
      this.#build()
      this.#machine = createMenuMachine({
        id: this.id || uid('gg-menu'),
        items: this.#items,
        defaultOpen: this.hasAttribute('open'),
        ...this.#options(),
        onOpenChange: (open, details) => {
          this.#reflecting = true
          this.toggleAttribute('open', open)
          this.#reflecting = false
          this.dispatchEvent(new CustomEvent('openchange', { detail: { open, ...details }, bubbles: true }))
        },
        onSelect: (value, details) => {
          this.dispatchEvent(new CustomEvent('itemselect', { detail: { value, ...details }, bubbles: true }))
        },
      })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = null
    this.#attached?.destroy()
    this.#attached = null
    // As <gg-select>: a menu that comes back open, with focus gone, is a popup
    // nobody is driving.
    if (this.#machine?.getState().open) this.#machine.send({ type: 'CLOSE', reason: 'api' })
  }

  attributeChangedCallback(name: string): void {
    const machine = this.#machine
    if (!machine) return
    if (name === 'open') {
      if (!this.#reflecting) machine.send({ type: 'SYNC_OPEN', open: this.hasAttribute('open') })
    } else if (name === 'items') {
      this.items = this.#parseItems()
    } else if (name === 'placement' || name === 'keep-open') {
      machine.send({ type: 'SYNC_OPTIONS', ...this.#options() })
    }
    if (this.isConnected) this.#render()
  }

  #parseItems(): MenuEntry[] {
    const raw = this.getAttribute('items')
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      console.warn('<gg-menu> has an invalid items attribute', this)
      return []
    }
  }

  #options() {
    return {
      placement: (this.getAttribute('placement') as MenuPlacement) ?? undefined,
      closeOnSelect: !this.hasAttribute('keep-open'),
    }
  }

  #build(): void {
    this.#trigger = slottedTrigger(this).trigger
    this.#content = h('div')
    this.append(this.#content)
  }

  #render(): void {
    const machine = this.#machine
    const content = this.#content
    if (!machine || !content) return

    const state = machine.getState()
    const api = connect(state, machine.send, domNormalizer, { label: this.getAttribute('label') ?? undefined })

    if (this.#trigger) spread(this.#trigger, api.triggerProps, 'menu')
    spread(content, api.contentProps)
    this.#renderNodes(api)

    if (state.open && !this.#attached && this.#trigger) {
      this.#attached = attachPopover(this.#trigger, content, {
        placement: state.placement,
        gutter: 4,
        manageFocus: true,
        onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
        // The size limit arrives after the focus below: scroll again against it.
        onPlaced: () => scrollIntoViewIfNeeded(document.getElementById(menuHighlightedId(machine.getState()) ?? ''), content),
      })
    } else if (!state.open && this.#attached) {
      this.#attached.destroy()
      this.#attached = null
    } else {
      this.#attached?.update({ placement: state.placement })
    }

    if (state.open) focusMenuItem(content, api.highlightedId)
  }

  #renderNodes(api: Api): void {
    const previous = this.#nodes
    const next = new Map<string, HTMLElement>()
    const take = (key: string, tag: 'div' | 'a' | 'span'): HTMLElement => {
      const existing = previous.get(key)
      const element = existing && existing.localName === tag ? existing : document.createElement(tag)
      next.set(key, element)
      return element
    }

    const row = (item: MenuItem, index: number): HTMLElement => {
      const props = api.getItemProps(item, index)
      const key = `item:${item.value}`
      const element = take(key, 'href' in props.attrs ? 'a' : 'div')
      spread(element, props)

      const text = take(`${key}:text`, 'span')
      spread(text, api.getItemTextProps())
      if (text.textContent !== item.label) text.textContent = item.label
      const parts = [text]

      if (item.shortcut) {
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
      syncChildren(element, parts)
      return element
    }

    const children = api.nodes.map((node) => {
      if (node.kind === 'item') return row(node.item, node.index)
      if (node.kind === 'separator') {
        const separator = take(node.key, 'div')
        spread(separator, api.separatorProps)
        return separator
      }
      const group = take(node.key, 'div')
      spread(group, api.getGroupProps(node))
      const rows: HTMLElement[] = []
      if (node.label) {
        const label = take(`${node.key}:label`, 'div')
        spread(label, api.getGroupLabelProps(node))
        if (label.textContent !== node.label) label.textContent = node.label
        rows.push(label)
      }
      for (const { item, index } of node.items) rows.push(row(item, index))
      syncChildren(group, rows)
      return group
    })

    syncChildren(this.#content!, children)
    this.#nodes = next
  }
}

if (!customElements.get('gg-menu')) customElements.define('gg-menu', GgMenuElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-menu': GgMenuElement
  }
}
