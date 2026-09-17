import {
  connect,
  createMenuMachine,
  type MenuEntry,
  type MenuEvent,
  type MenuPlacement,
  type MenuState,
} from '@ggary/core/menu'
import { domNormalizer, uid, type Machine } from '@ggary/core'
import { spread } from '../../spread'
import { slottedTrigger } from '../popover/popover.element'
import { MenuRenderer } from './menu-renderer'

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
  #reflecting = false
  #items: MenuEntry[] = []

  #trigger: HTMLElement | null = null
  #renderer: MenuRenderer | null = null

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
    this.#renderer?.destroy()
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
    this.#renderer = new MenuRenderer(
      () => this.#machine!.getState(),
      () => this.#trigger
    )
    this.append(this.#renderer.content)
  }

  #render(): void {
    const machine = this.#machine
    const renderer = this.#renderer
    if (!machine || !renderer) return
    const api = connect(machine.getState(), machine.send, domNormalizer, { label: this.getAttribute('label') ?? undefined })
    if (this.#trigger) spread(this.#trigger, api.triggerProps, 'menu')
    renderer.render(api)
  }
}

if (!customElements.get('gg-menu')) customElements.define('gg-menu', GgMenuElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-menu': GgMenuElement
  }
}
