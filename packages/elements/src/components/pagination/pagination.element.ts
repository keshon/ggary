import { connect } from '@ggary/core/pagination'
import { domNormalizer } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement of a pager that is already links:
 *
 *   <gg-pagination label="Pages">
 *     <a href="?page=1" aria-disabled="true">Back</a>
 *     <a href="?page=1" aria-current="page">1</a>
 *     <a href="?page=2">2</a>
 *     <span>…</span>
 *     <a href="?page=24">24</a>
 *   </gg-pagination>
 *
 * The host is the landmark, the children are wrapped in an <ol>, and a <span>
 * is a gap rather than a page. `data-page` on a link is the number that comes
 * back in the `pagechange` event; without it the element reads the link's text.
 */
export class GgPaginationElement extends HTMLElement {
  static observedAttributes = ['label']

  #list: HTMLOListElement | null = null
  #pages: { item: HTMLLIElement; link: HTMLElement; data: { label: string; href?: string; page?: number; current?: boolean; disabled?: boolean; gap?: boolean } }[] = []

  connectedCallback(): void {
    if (!this.#list) {
      const children = [...this.children].filter((child) => child.tagName === 'A' || child.tagName === 'SPAN')
      if (children.length === 0) {
        console.warn('<gg-pagination> expects <a> pages and <span> gaps inside it.', this)
        return
      }
      this.#list = h('ol')
      this.#pages = children.map((child) => {
        const link = child as HTMLElement
        const label = link.textContent?.trim() ?? ''
        const number = Number(link.dataset.page ?? label)
        return {
          item: h('li', undefined, [link]),
          link,
          data: {
            label,
            href: link.getAttribute('href') ?? undefined,
            page: Number.isFinite(number) ? number : undefined,
            current: link.hasAttribute('aria-current') && link.getAttribute('aria-current') !== 'false',
            disabled: link.getAttribute('aria-disabled') === 'true',
            gap: link.tagName === 'SPAN',
          },
        }
      })
      this.#list.append(...this.#pages.map((page) => page.item))
      this.replaceChildren(this.#list)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#list) return
    const api = connect(
      { items: this.#pages.map((page) => page.data), label: this.getAttribute('label') ?? undefined },
      domNormalizer,
      {
        onPageChange: (page, event) => {
          this.dispatchEvent(new CustomEvent('pagechange', { detail: { page, event }, bubbles: true }))
        },
      }
    )
    spread(this, { attrs: { ...api.rootProps.attrs, role: 'navigation' }, listeners: api.rootProps.listeners }, 'pagination')
    spread(this.#list, api.listProps)
    this.#pages.forEach((page) => {
      const parts = api.getItemProps(page.data)
      spread(page.item, parts.itemProps)
      spread(page.link, parts.linkProps)
    })
  }
}

if (!customElements.get('gg-pagination')) customElements.define('gg-pagination', GgPaginationElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-pagination': GgPaginationElement
  }
}
