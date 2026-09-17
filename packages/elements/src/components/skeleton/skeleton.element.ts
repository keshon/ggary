import { connect } from '@ggary/core/skeleton'
import { domNormalizer } from '@ggary/core'
import { h, reconcileChildren, spread } from '../../spread'

/**
 * <gg-skeleton lines="3" title></gg-skeleton> — the host is the stack of bars.
 * Put aria-busy on the region that is loading; the bars themselves say nothing.
 */
export class GgSkeletonElement extends HTMLElement {
  static observedAttributes = ['lines', 'title']

  #bars: HTMLSpanElement[] = []

  connectedCallback(): void {
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const lines = this.getAttribute('lines')
    const api = connect({ lines: lines === null ? undefined : Number(lines), title: this.hasAttribute('title') }, domNormalizer)
    spread(this, api.rootProps, 'skeleton')
    this.#bars = api.bars.map((bar, index) => {
      const element = this.#bars[index] ?? h('span')
      spread(element, bar.props)
      return element
    })
    reconcileChildren(this, this.#bars)
  }
}

if (!customElements.get('gg-skeleton')) customElements.define('gg-skeleton', GgSkeletonElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-skeleton': GgSkeletonElement
  }
}
