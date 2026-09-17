import {
  connect,
  createChipGroupMachine,
  type ChipGroupMode,
  type ChipGroupOrientation,
  type ChipItem,
} from '@ggary/core/chip-group'
import { onFormReset, domNormalizer, rovingFocus, uid, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Client-rendered, like <gg-select>.
 *
 *   <gg-chip-group label="Tags" mode="multi" removable></gg-chip-group>
 *   el.items = [{ value: 'design', label: 'Design' }]
 *
 * Removal is a request here too: the element fires `chipremove` and leaves
 * `items` alone. The owner decides. That keeps one rule across all three
 * adapters instead of the vanilla one quietly doing something different.
 */
export class GgChipGroupElement extends HTMLElement {
  static observedAttributes = ['label', 'mode', 'orientation', 'emphasis', 'size', 'removable', 'disabled', 'name']

  #machine: Machine<any, any> | null = null
  #unsubscribe: (() => void) | null = null
  #items: ChipItem[] = []
  #id = uid('gg-chips')
  #lastFocusNonce = 0

  #root: HTMLDivElement | null = null
  #label: HTMLSpanElement | null = null
  #list: HTMLDivElement | null = null
  #inputs: HTMLDivElement | null = null

  get items(): ChipItem[] {
    return this.#items
  }
  set items(next: ChipItem[]) {
    this.#items = next ?? []
    this.#machine?.send({ type: 'SYNC_ITEMS', items: this.#items })
  }

  get selection(): string[] {
    return this.#machine?.getState().selection ?? []
  }
  set selection(next: string[]) {
    this.#machine?.send({ type: 'SYNC_SELECTION', selection: next ?? [] })
  }

  #stopReset: (() => void) | null = null
  #initialSelection: string[] | null = null

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () =>
      this.#machine?.send({ type: 'SYNC_SELECTION', selection: this.#initialSelection ?? [] })
    )
    // Moved, not new: re-subscribe, as <gg-select> and <gg-field> do.
    if (this.#machine) {
      this.#unsubscribe = this.#machine.subscribe(() => this.#render())
      this.#render()
      return
    }

    if (this.#items.length === 0 && this.hasAttribute('items')) {
      try {
        this.#items = JSON.parse(this.getAttribute('items')!)
      } catch {
        console.warn('<gg-chip-group> has an invalid items attribute', this)
      }
    }

    this.#machine = createChipGroupMachine({
      id: this.#id,
      items: this.#items,
      mode: (this.getAttribute('mode') as ChipGroupMode) ?? undefined,
      orientation: (this.getAttribute('orientation') as ChipGroupOrientation) ?? undefined,
      disabled: this.hasAttribute('disabled'),
      removable: this.hasAttribute('removable'),
      onSelectionChange: (selection, items) => {
        this.dispatchEvent(new CustomEvent('selectionchange', { detail: { selection, items }, bubbles: true }))
      },
      onRemove: (value, item) => {
        this.dispatchEvent(new CustomEvent('chipremove', { detail: { value, item }, bubbles: true }))
      },
    })

    this.#root = h('div')
    this.#label = h('span')
    this.#list = h('div')
    this.#inputs = h('div')
    this.#inputs.hidden = true
    this.#root.append(this.#label, this.#list, this.#inputs)
    this.append(this.#root)

    this.#initialSelection ??= this.#machine.getState().selection
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
    this.#unsubscribe?.()
    this.#unsubscribe = null
  }

  attributeChangedCallback(name: string): void {
    if (!this.#machine) return
    if (name === 'disabled') {
      this.#machine.send({ type: 'SYNC_DISABLED', disabled: this.hasAttribute('disabled') })
    } else if (name === 'mode' || name === 'orientation' || name === 'removable') {
      // All three together: SYNC_OPTIONS reads an absent option as its default.
      this.#machine.send({
        type: 'SYNC_OPTIONS',
        mode: (this.getAttribute('mode') as ChipGroupMode) ?? undefined,
        orientation: (this.getAttribute('orientation') as ChipGroupOrientation) ?? undefined,
        removable: this.hasAttribute('removable'),
      })
      // A no-op sync returns the same state and notifies nobody, so render here
      // too: the attribute itself may be what a stylesheet reads.
      this.#render()
    } else {
      this.#render()
    }
  }

  #render(): void {
    const machine = this.#machine
    if (!machine || !this.#root) return

    const state = machine.getState()
    const api = connect(state, machine.send, domNormalizer, {
      label: this.getAttribute('label') ?? undefined,
      emphasis: (this.getAttribute('emphasis') as any) ?? undefined,
      size: (this.getAttribute('size') as any) ?? undefined,
      name: this.getAttribute('name') ?? undefined,
    })

    spread(this.#root, api.rootProps)
    spread(this.#label!, api.labelProps)
    spread(this.#list!, api.listProps)

    const labelText = this.getAttribute('label')
    this.#label!.textContent = labelText ?? ''
    this.#label!.hidden = !labelText

    this.#renderChips(api)
    this.#renderHiddenInputs(api)

    // Same nonce guard as the React and Svelte adapters: #render runs on every
    // state change, and re-focusing on each one would fight the user.
    if (state.focus.nonce !== 0 && state.focus.nonce !== this.#lastFocusNonce && state.focus.index >= 0) {
      this.#lastFocusNonce = state.focus.nonce
      rovingFocus(document, api.ids.chip(state.focus.index))
    }
  }

  #renderChips(api: ReturnType<typeof connect<any>>): void {
    const list = this.#list!

    if (api.items.length === 0) {
      list.replaceChildren(h('span', api.emptyProps, [this.getAttribute('empty-label') ?? 'Nothing here']))
      return
    }

    list.querySelector('[data-part="empty"]')?.remove()
    const rows = Array.from(list.children) as HTMLButtonElement[]
    while (rows.length > api.items.length) rows.pop()!.remove()

    const groupRemovable = this.hasAttribute('removable')

    api.items.forEach((item, index) => {
      let chip = rows[index]
      if (!chip) {
        chip = h('button', undefined, [h('span')])
        list.append(chip)
      }
      spread(chip, api.getChipProps(item, index))

      const label = chip.firstElementChild as HTMLElement
      spread(label, api.getChipLabelProps())
      label.textContent = item.label

      const wantsRemove = item.removable ?? groupRemovable
      let remove = chip.querySelector<HTMLElement>('[data-part="remove"]')
      if (wantsRemove && !remove) {
        remove = h('span', undefined, [h('span')])
        chip.append(remove)
      } else if (!wantsRemove && remove) {
        remove.remove()
        remove = null
      }
      if (remove) {
        spread(remove, api.getChipRemoveProps(item, index))
        spread(remove.firstElementChild!, api.getChipRemoveIconProps())
      }
    })
  }

  #renderHiddenInputs(api: ReturnType<typeof connect<any>>): void {
    const container = this.#inputs!
    if (!api.hasName) {
      container.replaceChildren()
      return
    }
    container.replaceChildren(...api.selection.map((value: string) => h('input', api.getHiddenInputProps(value))))
  }
}

if (!customElements.get('gg-chip-group')) customElements.define('gg-chip-group', GgChipGroupElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-chip-group': GgChipGroupElement
  }
}
