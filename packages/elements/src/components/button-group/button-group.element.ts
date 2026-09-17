import { connect } from '@ggary/core/button-group'
import { domNormalizer } from '@ggary/core'
import type { ButtonSize } from '@ggary/core/button'
import { spread } from '../../spread'

/**
 * The host is the group; the buttons inside stay ordinary buttons:
 *
 *   <gg-button-group size="sm">
 *     <gg-button size="sm"><button>Left</button></gg-button>
 *     <gg-button size="sm"><button>Centre</button></gg-button>
 *   </gg-button-group>
 *
 * Attributes: size (the size its buttons are, so the corners match), label.
 */
export class GgButtonGroupElement extends HTMLElement {
  static observedAttributes = ['size', 'label']

  connectedCallback(): void {
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const api = connect(
      { size: (this.getAttribute('size') as ButtonSize) ?? undefined, label: this.getAttribute('label') ?? undefined },
      domNormalizer
    )
    spread(this, api.rootProps, 'button-group')
  }
}

if (!customElements.get('gg-button-group')) customElements.define('gg-button-group', GgButtonGroupElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-button-group': GgButtonGroupElement
  }
}
