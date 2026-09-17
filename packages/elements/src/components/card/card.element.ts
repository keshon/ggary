import { connect, type CardProps } from '@ggary/core/card'
import { domNormalizer, type HeadingLevel, type RegionRank, type StatusTone } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement: the host is the card, its children the content.
 *
 *   <gg-card heading="worldbox-1" subtitle="Queued 2 min ago">…</gg-card>
 *
 * Attributes: heading, subtitle, heading-level, interactive, plain, rank, tone.
 * A card that is entirely a link is an <a>; with custom elements, write the
 * link as the card's only child and mark the card interactive.
 */
export class GgCardElement extends HTMLElement {
  static observedAttributes = ['heading', 'subtitle', 'heading-level', 'interactive', 'plain', 'rank', 'tone']

  #header: HTMLDivElement | null = null
  #title: HTMLElement | null = null
  #subtitle: HTMLParagraphElement | null = null

  connectedCallback(): void {
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const level = this.getAttribute('heading-level')
    const props: CardProps = {
      title: this.getAttribute('heading') ?? undefined,
      subtitle: this.getAttribute('subtitle') ?? undefined,
      headingLevel: level ? (Number(level) as HeadingLevel) : undefined,
      interactive: this.hasAttribute('interactive'),
      plain: this.hasAttribute('plain'),
      rank: (this.getAttribute('rank') as RegionRank) ?? undefined,
      tone: (this.getAttribute('tone') as StatusTone) ?? undefined,
    }
    const api = connect(props, domNormalizer)
    spread(this, api.rootProps, 'card')

    if (!api.showHeader) {
      this.#header?.remove()
      return
    }
    this.#header ??= h('div')
    spread(this.#header, api.headerProps)
    if (this.#title?.localName !== api.titleElement) {
      this.#title?.remove()
      this.#title = document.createElement(api.titleElement)
    }
    this.#subtitle ??= h('p')
    const parts: HTMLElement[] = []
    if (props.title !== undefined) {
      spread(this.#title, api.titleProps)
      this.#title.textContent = props.title
      parts.push(this.#title)
    }
    if (props.subtitle !== undefined) {
      spread(this.#subtitle, api.subtitleProps)
      this.#subtitle.textContent = props.subtitle
      parts.push(this.#subtitle)
    }
    this.#header.replaceChildren(...parts)
    if (this.firstElementChild !== this.#header) this.prepend(this.#header)
  }
}

if (!customElements.get('gg-card')) customElements.define('gg-card', GgCardElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-card': GgCardElement
  }
}
