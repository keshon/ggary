import { connect, type ButtonEmphasis, type ButtonSize, type ButtonTone } from '@ggary/core/button'
import { domNormalizer } from '@ggary/core'
import { spread } from '../../spread'

/**
 * Pattern A — light-DOM *enhancement*.
 *
 *   <gg-button tone="danger"><button>Delete</button></gg-button>
 *
 * The server (or a Go template) renders a real, working <button>. This element
 * only decorates it. No shadow DOM, no client-side markup generation, so there
 * is nothing to hydrate and no layout shift if the JS is slow or never arrives.
 *
 * Compare with select.element.ts, which has to take the other approach.
 */
export class GgButtonElement extends HTMLElement {
  static observedAttributes = ['emphasis', 'tone', 'size', 'disabled', 'loading', 'full-width', 'type']

  #button: HTMLButtonElement | null = null
  #spinner: HTMLSpanElement | null = null
  /**
   * The markup's own type, read before the first render writes one. Core
   * defaults to type="button", right for a framework component, where a stray
   * submit is the classic bug. Enhancement is the other way round: the markup
   * already means something, and a bare <button> in a form submits it.
   */
  #markupType: string | null = null

  connectedCallback(): void {
    if (!this.#button) {
      this.#button = this.querySelector('button')
      if (!this.#button) {
        console.warn('<gg-button> expects a <button> child to enhance.', this)
        return
      }
      this.#markupType = this.#button.getAttribute('type') ?? 'submit'
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.#button) this.#render()
  }

  #render(): void {
    const button = this.#button
    if (!button) return

    const loading = this.hasAttribute('loading')
    const api = connect(
      {
        emphasis: (this.getAttribute('emphasis') as ButtonEmphasis) ?? undefined,
        tone: (this.getAttribute('tone') as ButtonTone) ?? undefined,
        size: (this.getAttribute('size') as ButtonSize) ?? undefined,
        disabled: this.hasAttribute('disabled'),
        loading,
        fullWidth: this.hasAttribute('full-width'),
        type: (this.getAttribute('type') ?? this.#markupType ?? undefined) as 'button' | 'submit' | 'reset' | undefined,
      },
      domNormalizer
    )

    spread(button, api.rootProps)

    if (loading && !this.#spinner) {
      this.#spinner = document.createElement('span')
      spread(this.#spinner, api.spinnerProps)
      button.prepend(this.#spinner)
    } else if (!loading && this.#spinner) {
      this.#spinner.remove()
      this.#spinner = null
    }
  }
}

if (!customElements.get('gg-button')) customElements.define('gg-button', GgButtonElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-button': GgButtonElement
  }
}
