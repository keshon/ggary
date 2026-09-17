import { connect } from '@ggary/core/breadcrumbs'
import { domNormalizer } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * Enhancement of a path that is already links:
 *
 *   <gg-breadcrumbs label="Breadcrumbs">
 *     <a href="/projects">Projects</a>
 *     <a href="/projects/worldgen">worldgen</a>
 *     <span>Run #4127</span>
 *   </gg-breadcrumbs>
 *
 * The host becomes the landmark (role="navigation"); the crumbs are wrapped in
 * an <ol>, because the order is part of the meaning and a screen reader reads
 * the length of the path from it. The last crumb is the page: if the markup
 * left an <a> there, it is replaced by text — a link to where you already are
 * is a false action.
 */
export class GgBreadcrumbsElement extends HTMLElement {
  static observedAttributes = ['label']

  #list: HTMLOListElement | null = null
  #crumbs: { item: HTMLLIElement; link: HTMLElement; label: string; href?: string }[] = []

  connectedCallback(): void {
    if (!this.#list) {
      const children = [...this.children].filter((child) => child.tagName === 'A' || child.tagName === 'SPAN')
      if (children.length === 0) {
        console.warn('<gg-breadcrumbs> expects <a> or <span> crumbs inside it.', this)
        return
      }
      this.#list = h('ol')
      this.#crumbs = children.map((child, index) => {
        const last = index === children.length - 1
        const label = child.textContent?.trim() ?? ''
        const href = child.getAttribute('href') ?? undefined
        // The last crumb is text even when the markup made it a link.
        const link = last && child.tagName === 'A' ? h('span') : (child as HTMLElement)
        if (link !== child) link.textContent = label
        const item = h('li', undefined, [link])
        return { item, link, label, href }
      })
      this.#list.append(...this.#crumbs.map((crumb) => crumb.item))
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
      { items: this.#crumbs.map(({ label, href }) => ({ label, href })), label: this.getAttribute('label') ?? undefined },
      domNormalizer
    )
    // The host cannot be a <nav>, so it takes the role instead.
    spread(this, { attrs: { ...api.rootProps.attrs, role: 'navigation' }, listeners: api.rootProps.listeners }, 'breadcrumbs')
    spread(this.#list, api.listProps)
    this.#crumbs.forEach((crumb, index) => {
      const parts = api.getItemProps({ label: crumb.label, href: crumb.href }, index)
      spread(crumb.item, parts.itemProps)
      spread(crumb.link, parts.linkProps)
    })
  }
}

if (!customElements.get('gg-breadcrumbs')) customElements.define('gg-breadcrumbs', GgBreadcrumbsElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-breadcrumbs': GgBreadcrumbsElement
  }
}
