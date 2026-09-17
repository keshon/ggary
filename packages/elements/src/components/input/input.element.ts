import { connect, type InputSize, type InputType } from '@ggary/core/input'
import { domNormalizer } from '@ggary/core'
import { spread } from '../../spread'

/**
 * Light-DOM enhancement, like <gg-button>:
 *
 *   <gg-input size="sm"><input type="email" name="email" required></gg-input>
 *
 * The native input is the server's markup and stays the source of truth for
 * its value and its native attributes. This element adds the attribute
 * contract a theme styles against.
 *
 * INSIDE A <gg-field> IT DOES NOTHING. The outermost enhancer owns the control:
 * two elements spreading props onto one <input> would each remove the other's
 * attributes on every update. The field applies the input contract itself, and
 * reads this element's `size` to do it.
 */
export class GgInputElement extends HTMLElement {
  static observedAttributes = ['size', 'invalid']

  #input: HTMLInputElement | null = null

  connectedCallback(): void {
    if (this.closest('gg-field')) return
    this.#input = this.querySelector('input')
    if (!this.#input) {
      console.warn('<gg-input> expects an <input> child to enhance.', this)
      return
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    // Inside a field the field renders; tell it something changed.
    const field = this.closest('gg-field')
    if (field) {
      if ('refresh' in field) field.refresh()
    }
    else if (this.#input) this.#render()
  }

  #render(): void {
    const input = this.#input!
    const api = connect(
      {
        type: (input.getAttribute('type') as InputType) ?? undefined,
        size: (this.getAttribute('size') as InputSize) ?? undefined,
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer
    )
    spread(input, api.rootProps)
  }
}

if (!customElements.get('gg-input')) customElements.define('gg-input', GgInputElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-input': GgInputElement
  }
}
