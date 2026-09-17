import { connect } from '@ggary/core/empty-state'
import { domNormalizer, type HeadingLevel, type LiveMode } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement: the host is the empty state, its children the next step.
 *
 *   <gg-empty-state heading="No runs yet" description="Runs you start appear here." heading-level="2">
 *     <gg-button><button>Start a run</button></gg-button>
 *   </gg-empty-state>
 *
 * Attributes: heading, description, heading-level, live.
 */
export class GgEmptyStateElement extends HTMLElement {
  static observedAttributes = ['heading', 'description', 'heading-level', 'live']

  #title: HTMLElement | null = null
  #description: HTMLParagraphElement | null = null
  #actions: HTMLDivElement | null = null

  connectedCallback(): void {
    if (!this.#actions) {
      this.#actions = h('div')
      this.#actions.append(...this.childNodes)
      this.#description = h('p')
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#actions || !this.#description) return
    const level = this.getAttribute('heading-level')
    const description = this.getAttribute('description')
    const api = connect(
      {
        title: this.getAttribute('heading') ?? '',
        description: description ?? undefined,
        headingLevel: level ? (Number(level) as HeadingLevel) : undefined,
        live: (this.getAttribute('live') as LiveMode) ?? undefined,
      },
      domNormalizer
    )
    spread(this, api.rootProps, 'empty-state')
    if (this.#title?.localName !== api.titleElement) {
      this.#title?.remove()
      this.#title = document.createElement(api.titleElement)
    }
    spread(this.#title, api.titleProps)
    this.#title.textContent = this.getAttribute('heading') ?? ''
    spread(this.#description, api.descriptionProps)
    this.#description.textContent = description ?? ''
    spread(this.#actions, api.actionsProps)

    const parts: Element[] = [this.#title]
    if (description !== null) parts.push(this.#description)
    if (this.#actions.childNodes.length > 0) parts.push(this.#actions)
    const current = [...this.children]
    if (current.length !== parts.length || parts.some((part, i) => current[i] !== part)) this.replaceChildren(...parts)
  }
}

if (!customElements.get('gg-empty-state')) customElements.define('gg-empty-state', GgEmptyStateElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-empty-state': GgEmptyStateElement
  }
}
