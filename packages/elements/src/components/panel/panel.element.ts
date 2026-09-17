import { connect, type PanelBody } from '@ggary/core/panel'
import { domNormalizer, uid, type HeadingLevel, type RegionRank, type StatusTone } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement: the host is the panel. Children with slot="actions" go to the
 * header's far edge; everything else becomes the body.
 *
 *   <gg-panel heading="Runs" body="flush">
 *     <gg-button slot="actions" emphasis="minimal"><button>Refresh</button></gg-button>
 *     <table>…</table>
 *   </gg-panel>
 *
 * Attributes: heading, heading-level, body (padded, flush, list), plain, rank,
 * tone, region, scrollable.
 */
export class GgPanelElement extends HTMLElement {
  static observedAttributes = ['heading', 'heading-level', 'body', 'plain', 'rank', 'tone', 'region', 'scrollable']

  #id = uid('gg-panel')
  #header: HTMLDivElement | null = null
  #title: HTMLElement | null = null
  #actions: HTMLDivElement | null = null
  #body: HTMLDivElement | null = null

  connectedCallback(): void {
    if (!this.#body) {
      const actions = [...this.children].filter((child) => child.getAttribute('slot') === 'actions')
      const content = [...this.childNodes].filter((node) => !actions.includes(node as Element))
      this.#header = h('div')
      this.#actions = h('div')
      this.#actions.append(...actions)
      this.#body = h('div')
      this.#body.append(...content)
      this.append(this.#header, this.#body)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#body || !this.#header || !this.#actions) return
    const level = this.getAttribute('heading-level')
    const title = this.getAttribute('heading') ?? undefined
    const api = connect(
      {
        id: this.id || this.#id,
        title,
        headingLevel: level ? (Number(level) as HeadingLevel) : undefined,
        body: (this.getAttribute('body') as PanelBody) ?? undefined,
        plain: this.hasAttribute('plain'),
        rank: (this.getAttribute('rank') as RegionRank) ?? undefined,
        tone: (this.getAttribute('tone') as StatusTone) ?? undefined,
        region: this.hasAttribute('region'),
        scrollable: this.hasAttribute('scrollable'),
      },
      domNormalizer
    )
    spread(this, api.rootProps, 'panel')
    spread(this.#header, api.headerProps)
    spread(this.#actions, api.actionsProps)
    spread(this.#body, api.bodyProps)

    if (this.#title?.localName !== api.titleElement) {
      this.#title?.remove()
      this.#title = document.createElement(api.titleElement)
    }
    const parts: HTMLElement[] = []
    if (title !== undefined) {
      spread(this.#title, api.titleProps)
      this.#title.textContent = title
      parts.push(this.#title)
    }
    if (this.#actions.childElementCount > 0) parts.push(this.#actions)
    this.#header.replaceChildren(...parts)
    this.#header.hidden = parts.length === 0
  }
}

if (!customElements.get('gg-panel')) customElements.define('gg-panel', GgPanelElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-panel': GgPanelElement
  }
}
