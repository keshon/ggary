import { connect, type ChipSize, type ChipVariant } from '@ggary/core/chip'
import { domNormalizer } from '@ggary/core'
import { spread } from '../../spread'

export const REMOVE_ICON = 'M1.5 1.5l7 7M8.5 1.5l-7 7'

/**
 * Enhancement, like <gg-button>:
 *
 *   <gg-chip variant="outline"><span>Design</span></gg-chip>
 *
 * The server renders the chip's text; this element decorates it and, when
 * `removable` is set, appends the dismiss affordance.
 */
export class GgChipElement extends HTMLElement {
  static observedAttributes = ['variant', 'size', 'selected', 'disabled', 'removable']

  #host: HTMLElement | null = null
  #remove: HTMLSpanElement | null = null

  connectedCallback(): void {
    this.#host = this.querySelector<HTMLElement>('button, span, a')
    if (!this.#host) {
      console.warn('<gg-chip> expects a <span> or <button> child to enhance.', this)
      return
    }
    this.#host.setAttribute('data-part', 'label')
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.#host) this.#render()
  }

  #render(): void {
    const host = this.#host
    if (!host) return

    const removable = this.hasAttribute('removable')
    const interactive = host.tagName === 'BUTTON'
    const api = connect(
      {
        variant: (this.getAttribute('variant') as ChipVariant) ?? undefined,
        size: (this.getAttribute('size') as ChipSize) ?? undefined,
        selected: this.hasAttribute('selected'),
        disabled: this.hasAttribute('disabled'),
        removable,
        interactive,
      },
      domNormalizer,
      removable
        ? () => this.dispatchEvent(new CustomEvent('remove', { bubbles: true }))
        : undefined
    )

    // The enhanced element becomes the chip root; its original content becomes
    // the label, wrapped so the root can lay label and dismiss out side by side.
    spread(this, api.rootProps)
    spread(host, api.labelProps)

    if (removable && !this.#remove) {
      this.#remove = document.createElement('span')
      this.#remove.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="${REMOVE_ICON}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
      this.append(this.#remove)
    } else if (!removable && this.#remove) {
      this.#remove.remove()
      this.#remove = null
    }
    if (this.#remove) spread(this.#remove, api.removeProps)
  }
}

if (!customElements.get('gg-chip')) customElements.define('gg-chip', GgChipElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-chip': GgChipElement
  }
}
