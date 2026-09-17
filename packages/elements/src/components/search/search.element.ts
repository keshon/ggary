import { connect } from '@ggary/core/search'
import { domNormalizer, type Dict } from '@ggary/core'
import type { InputSize } from '@ggary/core/input'
import { h, spread } from '../../spread'
import type { FieldConsumer } from '../checkbox/choice'

/**
 * Enhancement of a native search field:
 *
 *   <gg-search label="Search the runs"><input type="search" name="q"></gg-search>
 *
 * The host is the wrapper; the magnifier is added before the input. The clear
 * cross and Escape are the browser's, which is why the input must be
 * `type="search"`. Attributes: label, size, disabled, readonly, required, invalid.
 * Inside a <gg-field> the field pushes its control props in with applyField().
 */
export class GgSearchElement extends HTMLElement implements FieldConsumer {
  static observedAttributes = ['label', 'size', 'disabled', 'readonly', 'required', 'invalid']

  #input: HTMLInputElement | null = null
  #icon: HTMLSpanElement | null = null
  #field: Dict | null = null
  #native = { disabled: false, readOnly: false, required: false }

  connectedCallback(): void {
    if (!this.#input) {
      const input = this.querySelector<HTMLInputElement>('input')
      if (!input) {
        console.warn('<gg-search> expects an <input type="search"> inside it.', this)
        return
      }
      if (input.type !== 'search') input.type = 'search'
      this.#input = input
      this.#native = {
        disabled: input.hasAttribute('disabled'),
        readOnly: input.hasAttribute('readonly'),
        required: input.hasAttribute('required'),
      }
      this.#icon = h('span')
      input.before(this.#icon)
    }
    const field = this.closest('gg-field')
    if (field && 'refresh' in field) field.refresh()
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  applyField(props: Dict | null): void {
    this.#field = props
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const input = this.#input
    if (!input || !this.#icon) return
    const api = connect(
      {
        size: (this.getAttribute('size') as InputSize) ?? undefined,
        label: this.getAttribute('label') ?? undefined,
        disabled: this.hasAttribute('disabled') || this.#native.disabled,
        readOnly: this.hasAttribute('readonly') || this.#native.readOnly,
        required: this.hasAttribute('required') || this.#native.required,
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer,
      { field: this.#field ?? undefined }
    )
    spread(this, api.rootProps, 'search')
    spread(this.#icon, api.iconProps)
    spread(input, api.inputProps)
  }
}

if (!customElements.get('gg-search')) customElements.define('gg-search', GgSearchElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-search': GgSearchElement
  }
}
