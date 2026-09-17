import { connect, type BadgeVariant } from '@ggary/core/badge'
import { domNormalizer, type StatusTone } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement: the host is the badge, its text the word.
 *
 *   <gg-badge tone="running">Running</gg-badge>
 *
 * Attributes: tone, variant (solid, outline, count), dot, no-dot.
 */
export class GgBadgeElement extends HTMLElement {
  static observedAttributes = ['tone', 'variant', 'dot', 'no-dot']

  #dot: HTMLSpanElement | null = null

  connectedCallback(): void {
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const api = connect(
      {
        tone: (this.getAttribute('tone') as StatusTone) ?? undefined,
        variant: (this.getAttribute('variant') as BadgeVariant) ?? undefined,
        dot: this.hasAttribute('no-dot') ? false : this.hasAttribute('dot') ? true : undefined,
      },
      domNormalizer
    )
    spread(this, api.rootProps, 'badge')
    if (api.showDot) {
      this.#dot ??= h('span')
      spread(this.#dot, api.dotProps)
      if (this.firstChild !== this.#dot) this.prepend(this.#dot)
    } else {
      this.#dot?.remove()
    }
  }
}

if (!customElements.get('gg-badge')) customElements.define('gg-badge', GgBadgeElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-badge': GgBadgeElement
  }
}
