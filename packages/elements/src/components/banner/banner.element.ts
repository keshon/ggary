import { connect } from '@ggary/core/banner'
import { domNormalizer, type LiveMode, type StatusTone } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement: the host is the banner. Children with slot="actions" go to the
 * far edge; everything else is the detail under the heading.
 *
 *   <gg-banner tone="warn" heading="Access expires in 3 days" dismissible>
 *     Renew before Friday to keep the runs.
 *     <gg-button slot="actions"><button>Renew</button></gg-button>
 *   </gg-banner>
 *
 * Attributes: tone, heading, live (polite, alert), dismissible, dismiss-label.
 * Event: dismiss (cancelable) — unless prevented, the banner hides itself.
 */
export class GgBannerElement extends HTMLElement {
  static observedAttributes = ['tone', 'heading', 'live', 'dismissible', 'dismiss-label']

  #icon: HTMLSpanElement | null = null
  #body: HTMLDivElement | null = null
  #title: HTMLParagraphElement | null = null
  #text: HTMLDivElement | null = null
  #actions: HTMLDivElement | null = null
  #close: HTMLButtonElement | null = null

  connectedCallback(): void {
    if (!this.#body) {
      const actions = [...this.children].filter((child) => child.getAttribute('slot') === 'actions')
      const text = [...this.childNodes].filter((node) => !actions.includes(node as Element))
      this.#icon = h('span')
      this.#title = h('p')
      this.#text = h('div')
      this.#text.append(...text)
      this.#body = h('div', undefined, [this.#title, this.#text])
      this.#actions = h('div')
      this.#actions.append(...actions)
      this.#close = h('button', undefined, [h('span')])
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#body) return
    const heading = this.getAttribute('heading')
    const api = connect(
      {
        tone: (this.getAttribute('tone') as StatusTone) ?? undefined,
        title: heading ?? undefined,
        live: (this.getAttribute('live') as LiveMode) ?? undefined,
        dismissible: this.hasAttribute('dismissible'),
        dismissLabel: this.getAttribute('dismiss-label') ?? undefined,
      },
      domNormalizer,
      () => {
        const proceed = this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, cancelable: true }))
        if (proceed) this.hidden = true
      }
    )
    spread(this, api.rootProps, 'banner')
    spread(this.#icon!, api.iconProps)
    spread(this.#body, api.bodyProps)
    spread(this.#title!, api.titleProps)
    this.#title!.textContent = heading ?? ''
    this.#title!.hidden = heading === null
    spread(this.#text!, api.textProps)
    this.#text!.hidden = this.#text!.childNodes.length === 0
    spread(this.#actions!, api.actionsProps)
    spread(this.#close!, api.closeProps)
    spread(this.#close!.firstElementChild!, api.closeIconProps)

    const parts: Element[] = []
    if (api.showIcon) parts.push(this.#icon!)
    parts.push(this.#body)
    if (this.#actions!.childElementCount > 0) parts.push(this.#actions!)
    if (api.showClose) parts.push(this.#close!)
    const current = [...this.children]
    if (current.length !== parts.length || parts.some((part, i) => current[i] !== part)) this.replaceChildren(...parts)
  }
}

if (!customElements.get('gg-banner')) customElements.define('gg-banner', GgBannerElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-banner': GgBannerElement
  }
}
