import { connect } from '@ggary/core/toolbar'
import { attachToolbarKeys, domNormalizer } from '@ggary/core'
import { spread } from '../../spread'

/**
 *   <gg-toolbar label="Tools">
 *     <gg-button size="sm" emphasis="minimal"><button aria-label="Move">…</button></gg-button>
 *     <span data-separator></span>
 *     <span data-spacer></span>
 *     <gg-badge>terrain_chunk_04</gg-badge>
 *   </gg-toolbar>
 *
 * A child with `data-separator` becomes the line between groups of tools, and
 * one with `data-spacer` pushes everything after it to the far edge. With a
 * `label` the strip is a toolbar: one tab stop, and the arrows move along it.
 */
export class GgToolbarElement extends HTMLElement {
  static observedAttributes = ['label', 'orientation']

  #stopKeys: (() => void) | null = null

  connectedCallback(): void {
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopKeys?.()
    this.#stopKeys = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const orientation = this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal'
    const api = connect({ label: this.getAttribute('label') ?? undefined, orientation }, domNormalizer)
    spread(this, api.rootProps, 'toolbar')
    for (const separator of this.querySelectorAll<HTMLElement>('[data-separator]')) spread(separator, api.separatorProps)
    for (const spacer of this.querySelectorAll<HTMLElement>('[data-spacer]')) spread(spacer, api.spacerProps)

    this.#stopKeys?.()
    this.#stopKeys = api.managed ? attachToolbarKeys(this, orientation) : null
  }
}

if (!customElements.get('gg-toolbar')) customElements.define('gg-toolbar', GgToolbarElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-toolbar': GgToolbarElement
  }
}
