import { connect, createTabsMachine, type TabItem, type TabsActivation, type TabsEvent, type TabsOrientation, type TabsState, type TabsVariant } from '@ggary/core/tabs'
import { domNormalizer, focusTab, uid, type Machine } from '@ggary/core'
import { h, reconcileChildren, spread } from '../../spread'

const TAB_ATTRIBUTES = ['data-tab', 'data-label', 'data-disabled', 'data-closable', 'data-modified']

/**
 * Tabs over the author's own panels:
 *
 *   <gg-tabs label="Object properties">
 *     <section data-tab="geometry" data-label="Geometry">…</section>
 *     <section data-tab="material" data-label="Material">…</section>
 *   </gg-tabs>
 *
 * Each child with `data-tab` is a panel, and its tab is built from it:
 * `data-label`, `data-disabled`, `data-closable`, `data-modified`. Adding or
 * removing a panel adds or removes its tab. Without panels, set the `items`
 * property for tabs that switch something rendered elsewhere.
 *
 * Attributes: value, label, orientation, activation, variant. Events:
 * valuechange ({ value }), tabclose ({ value }): remove the panel to close it.
 */
export class GgTabsElement extends HTMLElement {
  static observedAttributes = ['value', 'label', 'orientation', 'activation', 'variant']

  #machine: Machine<TabsState, TabsEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #observer: MutationObserver | null = null
  #reflecting = false
  #items: TabItem[] | null = null

  #list: HTMLDivElement | null = null
  #tabs = new Map<string, HTMLDivElement>()
  #lastFocusNonce = 0

  /** The tabs. Read from the panels when there are any; set it for tabs without panels. */
  get items(): TabItem[] {
    return this.#machine?.getState().items ?? this.#items ?? []
  }
  set items(next: TabItem[]) {
    this.#items = next ?? []
    this.#machine?.send({ type: 'SYNC_ITEMS', items: this.#readItems() })
  }

  get value(): string | null {
    return this.#machine?.getState().value ?? this.getAttribute('value')
  }
  set value(next: string | null) {
    if (next === null) this.removeAttribute('value')
    else this.setAttribute('value', next)
  }

  connectedCallback(): void {
    if (!this.#machine) {
      // The host is the root part: the author's panels are its children, and a
      // vertical layout has to hold the list and the panels side by side.
      this.#list = h('div')
      this.prepend(this.#list)
      this.#machine = createTabsMachine({
        id: this.id || uid('gg-tabs'),
        items: this.#readItems(),
        defaultValue: this.getAttribute('value'),
        orientation: (this.getAttribute('orientation') as TabsOrientation) ?? undefined,
        activation: (this.getAttribute('activation') as TabsActivation) ?? undefined,
        onValueChange: (value) => {
          this.#reflecting = true
          this.setAttribute('value', value)
          this.#reflecting = false
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
        },
        onClose: (value) => this.dispatchEvent(new CustomEvent('tabclose', { detail: { value }, bubbles: true })),
      })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    // Panels that come and go are tabs that come and go.
    this.#observer = new MutationObserver(() => this.#machine?.send({ type: 'SYNC_ITEMS', items: this.#readItems() }))
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: TAB_ATTRIBUTES })
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = null
    this.#observer?.disconnect()
    this.#observer = null
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    const machine = this.#machine
    if (!machine) return
    if (name === 'value') {
      if (!this.#reflecting) machine.send({ type: 'SYNC_VALUE', value: next })
    } else if (name === 'orientation' || name === 'activation') {
      machine.send({
        type: 'SYNC_OPTIONS',
        orientation: (this.getAttribute('orientation') as TabsOrientation) ?? undefined,
        activation: (this.getAttribute('activation') as TabsActivation) ?? undefined,
      })
    }
    if (this.isConnected) this.#render()
  }

  #panels(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(':scope > [data-tab]')]
  }

  #readItems(): TabItem[] {
    const panels = this.#panels()
    if (panels.length === 0) return this.#items ?? []
    return panels.map((panel) => ({
      value: panel.dataset.tab!,
      label: panel.dataset.label ?? panel.dataset.tab!,
      disabled: panel.hasAttribute('data-disabled') || undefined,
      closable: panel.hasAttribute('data-closable') || undefined,
      modified: panel.hasAttribute('data-modified') || undefined,
    }))
  }

  #render(): void {
    const machine = this.#machine
    const list = this.#list
    if (!machine || !list) return
    const state = machine.getState()
    const panels = this.#panels()
    const api = connect(state, machine.send, domNormalizer, {
      label: this.getAttribute('label') ?? undefined,
      variant: (this.getAttribute('variant') as TabsVariant) ?? undefined,
      panels: panels.length > 0,
    })

    // Our own writes to the panels are not the author's changes.
    this.#observer?.disconnect()

    spread(this, api.rootProps, 'tabs')
    spread(list, api.listProps)

    const tabs = new Map<string, HTMLDivElement>()
    const order = state.items.map((item) => {
      let tab = this.#tabs.get(item.value)
      if (!tab) tab = h('div', undefined, [h('span')])
      tabs.set(item.value, tab)
      spread(tab, api.getTabProps(item))
      const text = tab.firstElementChild as HTMLSpanElement
      spread(text, api.getTabTextProps())
      if (text.textContent !== item.label) text.textContent = item.label
      let close = tab.querySelector<HTMLButtonElement>(':scope > button')
      if (item.closable) {
        if (!close) {
          close = h('button', undefined, [h('span')])
          tab.append(close)
        }
        spread(close, api.getCloseProps(item))
        spread(close.firstElementChild!, api.closeIconProps)
      } else {
        close?.remove()
      }
      return tab
    })
    this.#tabs = tabs
    reconcileChildren(list, order)

    for (const panel of panels) {
      const item = state.items.find((candidate) => candidate.value === panel.dataset.tab)
      if (item) spread(panel, api.getPanelProps(item))
    }

    this.#observer?.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: TAB_ATTRIBUTES })

    if (api.focusNonce !== 0 && api.focusNonce !== this.#lastFocusNonce && api.focusValue !== null) {
      this.#lastFocusNonce = api.focusNonce
      focusTab(document, api.ids.tab(api.focusValue))
    }
  }
}

if (!customElements.get('gg-tabs')) customElements.define('gg-tabs', GgTabsElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-tabs': GgTabsElement
  }
}
