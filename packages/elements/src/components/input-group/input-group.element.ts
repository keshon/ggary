import { connect } from '@ggary/core/input-group'
import { connect as connectInput } from '@ggary/core/input'
import { domNormalizer } from '@ggary/core'
import type { InputSize, InputType } from '@ggary/core/input'
import { h, spread } from '../../spread'

/**
 * A field with something flush against it:
 *
 *   <gg-input-group prefix="$" suffix="per hour">
 *     <input type="number" name="rate" aria-label="Budget">
 *   </gg-input-group>
 *
 * The host is the group and carries the border; the control inside hands its
 * own outwards. An affix given as an attribute is created here; markup with
 * `slot="prefix"` or `slot="suffix"` — a button, say — is kept where it is.
 * Attributes: prefix, suffix, size, disabled, invalid.
 */
export class GgInputGroupElement extends HTMLElement {
  static observedAttributes = ['prefix', 'suffix', 'size', 'disabled', 'invalid']

  #prefix: HTMLSpanElement | null = null
  #suffix: HTMLSpanElement | null = null
  #ready = false

  connectedCallback(): void {
    if (!this.#ready) {
      this.#ready = true
      this.#prefix = h('span')
      this.#suffix = h('span')
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#prefix || !this.#suffix) return
    const prefix = this.getAttribute('prefix') ?? undefined
    const suffix = this.getAttribute('suffix') ?? undefined
    const api = connect(
      {
        prefix,
        suffix,
        size: (this.getAttribute('size') as InputSize) ?? undefined,
        disabled: this.hasAttribute('disabled'),
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer
    )
    spread(this, api.rootProps, 'input-group')
    spread(this.#prefix, api.prefixProps)
    spread(this.#suffix, api.suffixProps)
    this.#prefix.textContent = prefix ?? ''
    this.#suffix.textContent = suffix ?? ''

    // The group owns the field inside it, so it applies the input contract too
    // — a <gg-input> wrapper stands down, as it does inside a <gg-field>.
    const control = this.querySelector<HTMLInputElement>('input')
    if (control) {
      const input = connectInput(
        {
          type: (control.getAttribute('type') as InputType) ?? undefined,
          size: (this.getAttribute('size') as InputSize) ?? undefined,
          invalid: this.hasAttribute('invalid'),
        },
        domNormalizer
      )
      spread(control, input.rootProps, 'input-group')
    }

    if (api.showPrefix && this.firstElementChild !== this.#prefix) this.prepend(this.#prefix)
    if (!api.showPrefix && this.#prefix.isConnected) this.#prefix.remove()
    if (api.showSuffix && this.lastElementChild !== this.#suffix) this.append(this.#suffix)
    if (!api.showSuffix && this.#suffix.isConnected) this.#suffix.remove()
  }
}

if (!customElements.get('gg-input-group')) customElements.define('gg-input-group', GgInputGroupElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-input-group': GgInputGroupElement
  }
}
