import { connect, createMenubarMachine, type MenubarEvent, type MenubarMenu, type MenubarState } from '@ggary/core/menubar'
import { attachMenubarKeys, domNormalizer, rovingFocus, uid, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'
import { MenuRenderer } from '../menu/menu-renderer'

/**
 * A menubar:
 *
 *   <gg-menubar label="Application" mnemonics></gg-menubar>
 *   bar.menus = [{ value: 'file', label: '&File', items: [...] }, ...]
 *
 * Menus are data, as Menu's items are: the `menus` property, or a JSON `menus`
 * attribute. Attributes: label, mnemonics (Alt+key, F10), keep-open. Method:
 * close(). Events: itemselect ({ value, item, checked?, menu }), openchange
 * ({ menu }: the open menu's value, or null).
 */
export class GgMenubarElement extends HTMLElement {
  static observedAttributes = ['label', 'mnemonics', 'keep-open', 'menus']

  #machine: Machine<MenubarState, MenubarEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #stopKeys: (() => void) | null = null
  #menus: MenubarMenu[] = []

  #root: HTMLDivElement | null = null
  #items = new Map<string, HTMLButtonElement>()
  #open: { id: string; renderer: MenuRenderer } | null = null
  #lastFocus = -1
  /** What each label span last rendered, so an unchanged label keeps its nodes. */
  #labels = new WeakMap<HTMLElement, string>()

  get menus(): MenubarMenu[] {
    return this.#menus
  }
  set menus(next: MenubarMenu[]) {
    this.#menus = next ?? []
    this.#machine?.send({ type: 'SYNC_MENUS', menus: this.#menus })
  }

  close(): void {
    this.#machine?.send({ type: 'CLOSE' })
  }

  connectedCallback(): void {
    if (!this.#machine) {
      if (this.#menus.length === 0) this.#menus = this.#parseMenus()
      this.#root = h('div')
      this.append(this.#root)
      this.#machine = createMenubarMachine({
        id: this.id || uid('gg-menubar'),
        menus: this.#menus,
        closeOnSelect: !this.hasAttribute('keep-open'),
        onSelect: (value, details) => {
          this.dispatchEvent(new CustomEvent('itemselect', { detail: { value, ...details }, bubbles: true }))
        },
        onOpenChange: (menu) => {
          this.dispatchEvent(new CustomEvent('openchange', { detail: { menu }, bubbles: true }))
        },
      })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#syncKeys()
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = null
    this.#stopKeys?.()
    this.#stopKeys = null
    this.#open?.renderer.destroy()
    this.#open?.renderer.content.remove()
    this.#open = null
    if (this.#machine?.getState().openIndex !== -1) this.#machine?.send({ type: 'CLOSE' })
  }

  attributeChangedCallback(name: string): void {
    const machine = this.#machine
    if (!machine) return
    if (name === 'menus') this.menus = this.#parseMenus()
    else if (name === 'keep-open') machine.send({ type: 'SYNC_OPTIONS', closeOnSelect: !this.hasAttribute('keep-open') })
    else if (name === 'mnemonics' && this.isConnected) this.#syncKeys()
    if (this.isConnected) this.#render()
  }

  #parseMenus(): MenubarMenu[] {
    const raw = this.getAttribute('menus')
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      console.warn('<gg-menubar> has an invalid menus attribute', this)
      return []
    }
  }

  #syncKeys(): void {
    this.#stopKeys?.()
    this.#stopKeys = null
    const machine = this.#machine
    if (!machine || !this.hasAttribute('mnemonics')) return
    this.#stopKeys = attachMenubarKeys(document, {
      onMnemonic: (key, code) => {
        const before = machine.getState()
        machine.send({ type: 'MNEMONIC', key, code })
        return machine.getState() !== before
      },
      onShowMnemonics: (show) => machine.send({ type: 'SHOW_MNEMONICS', show }),
      onFocusBar: () => {
        // Focus first, then close: a menu that closes with focus outside it hands nothing back.
        this.#items.get(machine.getState().menus[0]?.value ?? '')?.focus()
        machine.send({ type: 'ENTER_BAR' })
      },
    })
  }

  #render(): void {
    const machine = this.#machine
    const root = this.#root
    if (!machine || !root) return
    const state = machine.getState()
    const api = connect(state, machine.send, domNormalizer, {
      label: this.getAttribute('label') ?? undefined,
      mnemonics: this.hasAttribute('mnemonics'),
    })
    spread(root, api.rootProps)

    // The open menu: a renderer per menu, replaced when another one opens.
    const openId = state.openIndex === -1 ? null : state.menu.id
    if (this.#open && this.#open.id !== openId) {
      this.#open.renderer.destroy()
      this.#open.renderer.content.remove()
      this.#open = null
    }
    if (openId && !this.#open) {
      const index = state.openIndex
      const renderer = new MenuRenderer(
        () => machine.getState().menu,
        () => this.#items.get(machine.getState().menus[index]?.value ?? '') ?? null
      )
      this.#open = { id: openId, renderer }
    }

    // Bar items, reused by value.
    const items = new Map<string, HTMLButtonElement>()
    const children: Element[] = []
    state.menus.forEach((menu, index) => {
      const button = this.#items.get(menu.value) ?? h('button', undefined, [h('span')])
      items.set(menu.value, button)
      spread(button, api.getItemProps(menu, index))
      const text = button.firstElementChild as HTMLSpanElement
      spread(text, api.getItemTextProps())
      const label = api.labelOf(menu)
      const signature = JSON.stringify(label)
      if (this.#labels.get(text) !== signature) {
        const parts: (Node | string)[] = [label.before]
        if (label.key) parts.push(h('span', api.mnemonicProps, [label.key]))
        parts.push(label.after)
        text.replaceChildren(...parts)
        this.#labels.set(text, signature)
      } else {
        const mnemonic = text.querySelector('span')
        if (mnemonic) spread(mnemonic, api.mnemonicProps)
      }
      children.push(button)
      if (index === state.openIndex && this.#open) children.push(this.#open.renderer.content)
    })
    this.#items = items

    const current = root.children
    if (current.length !== children.length || children.some((child, i) => current[i] !== child)) {
      root.replaceChildren(...children)
    }
    if (this.#open) this.#open.renderer.render(api.menu)

    // The tab stop moves with the arrows while no menu is open; focus follows it,
    // but only when it is already on the bar.
    if (state.openIndex === -1 && state.focusIndex !== this.#lastFocus && root.contains(document.activeElement)) {
      rovingFocus(document, api.ids.item(state.focusIndex))
    }
    this.#lastFocus = state.focusIndex
  }
}

if (!customElements.get('gg-menubar')) customElements.define('gg-menubar', GgMenubarElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-menubar': GgMenubarElement
  }
}
