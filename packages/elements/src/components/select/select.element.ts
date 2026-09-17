import { connect, createSelectMachine, type SelectItem } from '@ggary/core/select'
import {
  attachPositioner,
  domNormalizer,
  scrollIntoViewIfNeeded,
  trackDismissable,
  uid,
  type Machine,
} from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Pattern B — client-rendered custom element.
 *
 *   <gg-select label="Framework"></gg-select>
 *   el.items = [{ value: 'react', label: 'React' }]
 *
 * A listbox has no meaningful no-JS equivalent to enhance, so unlike <gg-button>
 * this one builds its own light DOM. Give the host element a min-height in CSS
 * if you render it above the fold, or you will get layout shift on upgrade.
 *
 * Still no shadow DOM: the same theme stylesheet reaches it, and the
 * host app can theme it with the same [data-part] selectors as React and Svelte.
 */
export class GgSelectElement extends HTMLElement {
  static observedAttributes = ['label', 'placeholder', 'disabled', 'name', 'value']

  #machine: Machine<any, any> | null = null
  #unsubscribe: (() => void) | null = null
  #teardownOpen: (() => void) | null = null
  #items: SelectItem[] = []
  #id = uid('gg-select')

  // DOM refs, built once in #build()
  #root: HTMLDivElement | null = null
  #label: HTMLLabelElement | null = null
  #trigger: HTMLButtonElement | null = null
  #value: HTMLSpanElement | null = null
  #indicator: HTMLSpanElement | null = null
  #positioner: HTMLDivElement | null = null
  #content: HTMLUListElement | null = null
  #hiddenInput: HTMLInputElement | null = null

  // --- public property API (attributes are the fallback, properties win) -----

  get items(): SelectItem[] {
    return this.#items
  }
  set items(next: SelectItem[]) {
    this.#items = next ?? []
    this.#machine?.send({ type: 'SYNC_ITEMS', items: this.#items })
  }

  get value(): string | null {
    return this.#machine?.getState().value ?? null
  }
  set value(next: string | null) {
    this.#machine?.send({ type: 'SYNC_VALUE', value: next })
  }

  // --- lifecycle -------------------------------------------------------------

  connectedCallback(): void {
    // Moved, not new: the DOM and the state are intact, only the subscription
    // went away on disconnect. Returning here without it was a dead element.
    if (this.#machine) {
      this.#unsubscribe = this.#machine.subscribe(() => this.#render())
      this.#render()
      return
    }

    // `items` may have been assigned before upgrade; JSON attribute is a fallback
    // for server-rendered pages that cannot set properties.
    if (this.#items.length === 0 && this.hasAttribute('items')) {
      try {
        this.#items = JSON.parse(this.getAttribute('items')!)
      } catch {
        console.warn('<gg-select> has an invalid items attribute', this)
      }
    }

    this.#machine = createSelectMachine({
      id: this.#id,
      items: this.#items,
      defaultValue: this.getAttribute('value'),
      disabled: this.hasAttribute('disabled'),
      onValueChange: (value, item) => {
        this.dispatchEvent(new CustomEvent('valuechange', { detail: { value, item }, bubbles: true }))
      },
    })

    this.#build()
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#teardownOpen?.()
    this.#unsubscribe = this.#teardownOpen = null
    // An open listbox does not survive leaving the document: coming back open,
    // with focus gone from the trigger, is a popup nobody is driving. Closing
    // after unsubscribing changes state without rendering into a detached tree.
    if (this.#machine?.getState().open) this.#machine.send({ type: 'CLOSE' })
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (!this.#machine) return
    if (name === 'disabled') this.#machine.send({ type: 'SYNC_DISABLED', disabled: this.hasAttribute('disabled') })
    else if (name === 'value') this.#machine.send({ type: 'SYNC_VALUE', value: next })
    else this.#render()
  }

  // --- rendering -------------------------------------------------------------

  #build(): void {
    this.#root = h('div')
    this.#label = h('label')
    this.#trigger = h('button')
    this.#value = h('span')
    this.#indicator = h('span')
    this.#positioner = h('div')
    this.#content = h('ul')
    this.#hiddenInput = h('input')

    this.#trigger.append(this.#value, this.#indicator)
    this.#positioner.append(this.#content)
    this.#root.append(this.#label, this.#trigger, this.#positioner, this.#hiddenInput)
    this.append(this.#root)
  }

  #render(): void {
    const machine = this.#machine
    if (!machine || !this.#root) return

    const state = machine.getState()
    const api = connect(state, machine.send, domNormalizer, {
      placeholder: this.getAttribute('placeholder') ?? undefined,
      name: this.getAttribute('name') ?? undefined,
    })

    spread(this.#root, api.rootProps)
    spread(this.#trigger!, api.triggerProps)
    spread(this.#value!, api.valueProps)
    spread(this.#indicator!, api.indicatorProps)
    spread(this.#positioner!, api.positionerProps)
    spread(this.#content!, api.contentProps)
    spread(this.#hiddenInput!, api.hiddenInputProps)

    const labelText = this.getAttribute('label')
    spread(this.#label!, api.labelProps)
    this.#label!.textContent = labelText ?? ''
    this.#label!.hidden = !labelText
    this.#value!.textContent = api.displayText
    this.#hiddenInput!.hidden = !this.getAttribute('name')

    this.#renderItems(api)
    this.#syncOpenState(state, api)
  }

  /** Crude but honest reconciliation: reuse <li> nodes, add/remove the delta. */
  #renderItems(api: ReturnType<typeof connect<any>>): void {
    const content = this.#content!

    if (api.items.length === 0) {
      content.replaceChildren(h('li', api.emptyProps, ['No options']))
      return
    }

    content.querySelector('[data-part="empty"]')?.remove()
    const rows = Array.from(content.children) as HTMLLIElement[]

    while (rows.length > api.items.length) rows.pop()!.remove()

    api.items.forEach((item, index) => {
      let row = rows[index]
      if (!row) {
        row = h('li', undefined, [h('span'), h('span')])
        content.append(row)
      }
      spread(row, api.getItemProps(item, index))
      const [text, check] = Array.from(row.children) as [HTMLElement, HTMLElement]
      spread(text, api.getItemTextProps())
      spread(check, api.getItemIndicatorProps())
      text.textContent = item.label
    })
  }

  #syncOpenState(state: { open: boolean; highlightedIndex: number }, api: ReturnType<typeof connect<any>>): void {
    if (state.open && !this.#teardownOpen) {
      const stopPositioning = attachPositioner(this.#trigger!, this.#positioner!)
      const stopDismiss = trackDismissable(this.#positioner!, {
        exclude: [this.#trigger!],
        onDismiss: () => {
          this.#machine!.send({ type: 'CLOSE' })
          this.#trigger!.focus()
        },
      })
      this.#teardownOpen = () => {
        stopPositioning()
        stopDismiss()
      }
    } else if (!state.open && this.#teardownOpen) {
      this.#teardownOpen()
      this.#teardownOpen = null
    }

    if (state.open && state.highlightedIndex >= 0) {
      scrollIntoViewIfNeeded(document.getElementById(api.ids.item(state.highlightedIndex)), this.#content)
    }
  }
}

if (!customElements.get('gg-select')) customElements.define('gg-select', GgSelectElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-select': GgSelectElement
  }
}
