import { connect } from '@ggary/core/note'
import { domNormalizer, type LiveMode, type StatusTone } from '@ggary/core'
import { h, spread } from '../../spread'

/** <gg-note tone="warn">The run uses a model that is being retired.</gg-note> — attributes: tone, live. */
export class GgNoteElement extends HTMLElement {
  static observedAttributes = ['tone', 'live']

  #icon: HTMLSpanElement | null = null
  #body: HTMLDivElement | null = null

  connectedCallback(): void {
    if (!this.#body) {
      this.#icon = h('span')
      this.#body = h('div')
      this.#body.append(...this.childNodes)
      this.append(this.#body)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#body || !this.#icon) return
    const api = connect(
      { tone: (this.getAttribute('tone') as StatusTone) ?? undefined, live: (this.getAttribute('live') as LiveMode) ?? undefined },
      domNormalizer
    )
    spread(this, api.rootProps, 'note')
    spread(this.#icon, api.iconProps)
    spread(this.#body, api.bodyProps)
    if (api.showIcon && this.firstElementChild !== this.#icon) this.prepend(this.#icon)
    if (!api.showIcon) this.#icon.remove()
  }
}

if (!customElements.get('gg-note')) customElements.define('gg-note', GgNoteElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-note': GgNoteElement
  }
}
