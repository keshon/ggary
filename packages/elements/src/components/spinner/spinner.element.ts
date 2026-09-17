import { connect, type SpinnerSize } from '@ggary/core/spinner'
import { domNormalizer } from '@ggary/core'
import { h, spread } from '../../spread'

/** <gg-spinner label="Loading runs" size="sm"></gg-spinner> — the host is the spinner. */
export class GgSpinnerElement extends HTMLElement {
  static observedAttributes = ['label', 'size']

  #track: HTMLSpanElement | null = null
  #arc: HTMLSpanElement | null = null

  connectedCallback(): void {
    if (!this.#track) {
      this.#track = h('span')
      this.#arc = h('span')
      this.append(this.#track, this.#arc)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#track || !this.#arc) return
    const api = connect(
      { label: this.getAttribute('label') ?? undefined, size: (this.getAttribute('size') as SpinnerSize) ?? undefined },
      domNormalizer
    )
    spread(this, api.rootProps, 'spinner')
    spread(this.#track, api.trackProps)
    spread(this.#arc, api.arcProps)
  }
}

if (!customElements.get('gg-spinner')) customElements.define('gg-spinner', GgSpinnerElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-spinner': GgSpinnerElement
  }
}
