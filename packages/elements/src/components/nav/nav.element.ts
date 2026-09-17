import { connect } from '@ggary/core/nav'
import { domNormalizer, uid } from '@ggary/core'
import type { IconName } from '@ggary/icons'
import { h, spread } from '../../spread'

interface NavLink {
  anchor: HTMLAnchorElement
  icon: HTMLSpanElement
  count: HTMLSpanElement | null
  item: { label: string; href: string; icon?: IconName; count?: string; current: boolean }
}

/**
 * Enhancement of the side column's links, which are markup before any script:
 *
 *   <gg-nav label="Sections">
 *     <div data-group="Work">
 *       <a href="/runs" aria-current="page" data-icon="grid">Runs<span data-count>7</span></a>
 *       <a href="/queue" data-icon="list">Queue</a>
 *     </div>
 *   </gg-nav>
 *
 * The host is the landmark. A child with `data-group` is a group named by that
 * attribute; anchors outside one are a group with no name. The current item is
 * `aria-current="page"` in the markup — the element never decides it, because
 * the server knows which page it rendered.
 */
export class GgNavElement extends HTMLElement {
  static observedAttributes = ['label']

  #groups: { element: HTMLElement; label: HTMLSpanElement | null; name?: string; links: NavLink[] }[] = []
  #id = ''

  connectedCallback(): void {
    if (this.#groups.length === 0) {
      const anchors = [...this.querySelectorAll<HTMLAnchorElement>('a[href]')]
      if (anchors.length === 0) {
        console.warn('<gg-nav> expects <a href> items inside it.', this)
        return
      }
      this.#id = this.id || uid('gg-nav')
      const containers = [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement)
      this.#groups = containers.map((element) => {
        const groupLabel = element.dataset.group
        const links = [...element.querySelectorAll<HTMLAnchorElement>('a[href]')].map((anchor) => this.#buildLink(anchor))
        const label = groupLabel === undefined ? null : h('span')
        if (label) {
          label.textContent = groupLabel ?? ''
          element.prepend(label)
        }
        return { element, label, name: groupLabel, links }
      })
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #buildLink(anchor: HTMLAnchorElement): NavLink {
    const countNode = anchor.querySelector<HTMLSpanElement>('[data-count]')
    const icon = h('span')
    anchor.prepend(icon)
    const iconName = anchor.dataset.icon as IconName | undefined
    // The name is read once and taken off the anchor: a mask clips everything on
    // its element, so data-icon left here would hide the label it belongs to.
    delete anchor.dataset.icon
    return {
      anchor,
      icon,
      count: countNode,
      item: {
        label: anchor.textContent?.trim() ?? '',
        href: anchor.getAttribute('href') ?? '',
        icon: iconName,
        count: countNode?.textContent ?? undefined,
        current: anchor.hasAttribute('aria-current') && anchor.getAttribute('aria-current') !== 'false',
      },
    }
  }

  #render(): void {
    if (this.#groups.length === 0) return
    const api = connect(
      {
        id: this.#id,
        label: this.getAttribute('label') ?? '',
        groups: this.#groups.map((group) => ({ label: group.name, items: group.links.map((link) => link.item) })),
      },
      domNormalizer
    )
    spread(this, { attrs: { ...api.rootProps.attrs, role: 'navigation' }, listeners: api.rootProps.listeners }, 'nav')
    this.#groups.forEach((group, index) => {
      const parts = api.getGroupProps({ label: group.name, items: group.links.map((link) => link.item) }, index)
      spread(group.element, parts.groupProps)
      if (group.label) spread(group.label, parts.groupLabelProps)
      for (const link of group.links) {
        const item = api.getItemProps(link.item)
        spread(link.anchor, item.itemProps)
        spread(link.icon, item.iconProps)
        link.icon.hidden = !item.showIcon
        if (link.count) spread(link.count, item.countProps)
      }
    })
  }
}

if (!customElements.get('gg-nav')) customElements.define('gg-nav', GgNavElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-nav': GgNavElement
  }
}
