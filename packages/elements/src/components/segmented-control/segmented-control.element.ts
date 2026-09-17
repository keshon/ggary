import { connect, type SegmentedControlSize } from '@ggary/core/segmented-control'
import { domNormalizer, onFormReset, uid } from '@ggary/core'
import { h, spread } from '../../spread'

interface Segment {
  item: HTMLLabelElement
  input: HTMLInputElement
  text: HTMLSpanElement
  value: string
  label: string
  disabled: boolean
}

/**
 * Enhancement of native radios, which work before this script runs:
 *
 *   <gg-segmented-control label="View" name="view">
 *     <label><input type="radio" value="list" checked> List</label>
 *     <label><input type="radio" value="grid"> Grid</label>
 *   </gg-segmented-control>
 *
 * The host is the radiogroup. Attributes: label, name, size, disabled, required,
 * full-width. Property: value. Event: valuechange { value }.
 */
export class GgSegmentedControlElement extends HTMLElement {
  static observedAttributes = ['label', 'name', 'size', 'disabled', 'required', 'full-width']

  #segments: Segment[] = []
  #id = ''
  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#render())
    if (this.#segments.length === 0) {
      const inputs = [...this.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      if (inputs.length === 0) {
        console.warn('<gg-segmented-control> expects <input type="radio"> options inside it.', this)
        return
      }
      this.#id = this.id || uid('gg-segmented')
      this.#segments = inputs.map((input) => {
        const existing = input.closest('label')
        const item = existing && this.contains(existing) ? existing : document.createElement('label')
        if (item !== existing) input.before(item)
        const text = h('span')
        text.append(...[...item.childNodes].filter((node) => node !== input))
        item.replaceChildren(input, text)
        const label = text.textContent?.trim() ?? ''
        return { item, input, text, value: input.value, label, disabled: input.hasAttribute('disabled') }
      })
      this.replaceChildren(...this.#segments.map((segment) => segment.item))
    }
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  get value(): string | null {
    return this.#segments.find((segment) => segment.input.checked)?.value ?? null
  }
  set value(next: string | null) {
    for (const segment of this.#segments) segment.input.checked = segment.value === next
    this.#render()
  }

  #render(): void {
    if (this.#segments.length === 0) return
    const items = this.#segments.map(({ value, label, disabled }) => ({ value, label, disabled }))
    const api = connect(
      {
        id: this.#id,
        items,
        label: this.getAttribute('label') ?? '',
        name: this.getAttribute('name') ?? this.#segments[0].input.getAttribute('name') ?? undefined,
        value: this.value,
        size: (this.getAttribute('size') as SegmentedControlSize) ?? undefined,
        disabled: this.hasAttribute('disabled'),
        required: this.hasAttribute('required'),
        fullWidth: this.hasAttribute('full-width'),
      },
      domNormalizer,
      {
        nativeChecked: true,
        onValueChange: (value) => {
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
          this.#render()
        },
      }
    )
    spread(this, api.rootProps, 'segmented-control')
    this.#segments.forEach((segment, index) => {
      const parts = api.getItemProps(items[index], index)
      spread(segment.item, parts.itemProps)
      spread(segment.input, parts.inputProps)
      spread(segment.text, parts.textProps)
    })
  }
}

if (!customElements.get('gg-segmented-control')) customElements.define('gg-segmented-control', GgSegmentedControlElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-segmented-control': GgSegmentedControlElement
  }
}
