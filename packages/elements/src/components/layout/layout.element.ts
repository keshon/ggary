import { connect as connectShell, createShellMachine, type ShellCollapse, type ShellEvent, type ShellState } from '@ggary/core/shell'
import { connect as connectSplit, createSplitMachine, type SplitEvent, type SplitOrientation, type SplitPrimary, type SplitState } from '@ggary/core/split'
import { connect as connectRail, type RailItem } from '@ggary/core/rail'
import { connect as connectStatusBar } from '@ggary/core/status-bar'
import { attachShellDrawer, domNormalizer, uid, type Machine, type StatusTone } from '@ggary/core'
import type { IconName } from '@ggary/icons'
import { h, spread } from '../../spread'

/**
 * The application frame, built around the author's markup:
 *
 *   <gg-shell>
 *     <a slot="brand" href="/">Leads</a>
 *     <gg-nav slot="aside" label="Sections">…</gg-nav>
 *     <gg-breadcrumbs slot="header">…</gg-breadcrumbs>
 *     <gg-status-bar slot="footer">…</gg-status-bar>
 *     … the work area …
 *   </gg-shell>
 *
 * Children are placed by `slot`: brand and aside make the side column, header
 * the strip over the work area, footer the status strip; every other child is
 * the work area, the page's `main`. The host is the grid. Attributes: collapse
 * (drawer, bar), open, skip-label, toggle-label, aside-label. Event: openchange.
 */
export class GgShellElement extends HTMLElement {
  static observedAttributes = ['collapse', 'open', 'skip-label', 'toggle-label', 'aside-label']

  #machine: Machine<ShellState, ShellEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #drawer: (() => void) | null = null
  #reflecting = false
  #parts: {
    skip: HTMLAnchorElement
    aside: HTMLDivElement | null
    brand: HTMLDivElement | null
    header: HTMLElement
    toggle: HTMLButtonElement | null
    toggleIcon: HTMLSpanElement | null
    main: HTMLElement
    footer: HTMLElement | null
  } | null = null

  get open(): boolean {
    return this.#machine?.getState().open ?? this.hasAttribute('open')
  }
  set open(next: boolean) {
    this.toggleAttribute('open', next)
  }

  connectedCallback(): void {
    if (!this.#machine) {
      this.#build()
      this.#machine = createShellMachine({
        id: this.id || uid('gg-shell'),
        defaultOpen: this.hasAttribute('open'),
        collapse: this.#collapse(),
        onOpenChange: (open, details) => {
          this.#reflecting = true
          this.toggleAttribute('open', open)
          this.#reflecting = false
          this.dispatchEvent(new CustomEvent('openchange', { detail: { open, ...details }, bubbles: true }))
        },
      })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = null
    this.#drawer?.()
    this.#drawer = null
  }

  attributeChangedCallback(name: string): void {
    const machine = this.#machine
    if (!machine) return
    if (name === 'open' && !this.#reflecting) machine.send({ type: 'SYNC_OPEN', open: this.hasAttribute('open') })
    else if (name === 'collapse') machine.send({ type: 'SYNC_OPTIONS', collapse: this.#collapse() })
    this.#render()
  }

  #collapse(): ShellCollapse {
    return this.getAttribute('collapse') === 'bar' ? 'bar' : 'drawer'
  }

  #build(): void {
    const children = [...this.childNodes]
    const slotted = (name: string) => children.filter((node): node is HTMLElement => node instanceof HTMLElement && node.getAttribute('slot') === name)
    const brandNodes = slotted('brand')
    const asideNodes = slotted('aside')
    const headerNodes = slotted('header')
    const footerNodes = slotted('footer')
    const placed = new Set<Node>([...brandNodes, ...asideNodes, ...headerNodes, ...footerNodes])
    const column = brandNodes.length + asideNodes.length > 0

    const skip = h('a')
    const aside = column ? h('div') : null
    const brand = brandNodes.length > 0 ? h('div') : null
    const header = h('header')
    const toggle = column ? h('button') : null
    const toggleIcon = toggle ? h('span') : null
    const main = h('main')
    const footer = footerNodes.length > 0 ? h('footer') : null

    if (brand) brand.append(...brandNodes)
    if (aside) aside.append(...(brand ? [brand] : []), ...asideNodes)
    if (toggle && toggleIcon) {
      toggle.append(toggleIcon)
      header.append(toggle)
    }
    header.append(...headerNodes)
    main.append(...children.filter((node) => !placed.has(node)))
    footer?.append(...footerNodes)
    for (const node of placed) (node as HTMLElement).removeAttribute('slot')

    this.replaceChildren(skip, ...(aside ? [aside] : []), header, main, ...(footer ? [footer] : []))
    this.#parts = { skip, aside, brand, header, toggle, toggleIcon, main, footer }
  }

  #render(): void {
    const machine = this.#machine
    const parts = this.#parts
    if (!machine || !parts) return
    const api = connectShell(machine.getState(), machine.send, domNormalizer, {
      skipLabel: this.getAttribute('skip-label') ?? undefined,
      toggleLabel: this.getAttribute('toggle-label') ?? undefined,
      asideLabel: this.getAttribute('aside-label') ?? undefined,
    })
    spread(this, api.rootProps, 'shell')
    spread(parts.skip, api.skipLinkProps)
    if (parts.skip.textContent !== api.skipLabel) parts.skip.textContent = api.skipLabel
    if (parts.aside) spread(parts.aside, api.asideProps)
    if (parts.brand) spread(parts.brand, api.brandProps)
    spread(parts.header, api.headerProps)
    if (parts.toggle) spread(parts.toggle, api.toggleProps)
    if (parts.toggleIcon) spread(parts.toggleIcon, api.toggleIconProps)
    spread(parts.main, api.mainProps)
    if (parts.footer) spread(parts.footer, api.footerProps)

    if (api.open && !this.#drawer && parts.aside) {
      this.#drawer = attachShellDrawer(this, parts.aside, parts.toggle, { onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }) })
    } else if (!api.open && this.#drawer) {
      this.#drawer()
      this.#drawer = null
    }
  }
}

/**
 * Two panes and a separator that can be dragged or moved from the keyboard:
 *
 *   <gg-split label="Resize the lead list" default-size="360" collapsible>
 *     <section>… the list …</section>
 *     <section>… the lead …</section>
 *   </gg-split>
 *
 * The first two element children are the panes. Attributes: label, orientation
 * (horizontal, vertical), primary (start, end), min, max, step, default-size,
 * size, collapsible, collapsed, rest-min. Property: size. Event: sizechange
 * ({ size, collapsed }).
 */
export class GgSplitElement extends HTMLElement {
  static observedAttributes = ['label', 'orientation', 'primary', 'min', 'max', 'step', 'default-size', 'collapsible', 'rest-min']

  #machine: Machine<SplitState, SplitEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #parts: { start: HTMLElement; separator: HTMLDivElement; handle: HTMLSpanElement; end: HTMLElement } | null = null

  get size(): number | null {
    return this.#machine?.getState().size ?? null
  }
  set size(next: number) {
    this.#machine?.send({ type: 'SYNC_SIZE', size: next })
  }

  connectedCallback(): void {
    if (!this.#machine) {
      const panes = [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement)
      if (panes.length < 2) {
        console.warn('<gg-split> expects two element children, its panes.', this)
        return
      }
      const [start, end] = panes
      const separator = h('div')
      const handle = h('span')
      separator.append(handle)
      start.after(separator)
      this.#parts = { start, separator, handle, end }
      const number = (name: string) => (this.hasAttribute(name) ? Number(this.getAttribute(name)) : undefined)
      this.#machine = createSplitMachine({
        id: this.id || uid('gg-split'),
        ...this.#options(),
        size: number('size'),
        collapsed: this.hasAttribute('collapsed'),
        onSizeChange: (size, details) => this.dispatchEvent(new CustomEvent('sizechange', { detail: { size, ...details }, bubbles: true })),
      })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = null
  }

  attributeChangedCallback(): void {
    if (!this.#machine) return
    this.#machine.send({ type: 'SYNC_OPTIONS', ...this.#options() })
    this.#render()
  }

  #options() {
    const number = (name: string) => (this.hasAttribute(name) ? Number(this.getAttribute(name)) : undefined)
    return {
      orientation: (this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal') as SplitOrientation,
      primary: (this.getAttribute('primary') === 'end' ? 'end' : 'start') as SplitPrimary,
      min: number('min'),
      max: number('max'),
      step: number('step'),
      defaultSize: number('default-size'),
      collapsible: this.hasAttribute('collapsible'),
    }
  }

  #render(): void {
    const machine = this.#machine
    const parts = this.#parts
    if (!machine || !parts) return
    const restMin = this.getAttribute('rest-min')
    const api = connectSplit(machine.getState(), machine.send, domNormalizer, {
      label: this.getAttribute('label') ?? '',
      restMin: restMin === null ? undefined : Number(restMin),
    })
    spread(this, api.rootProps, 'split')
    spread(parts.start, api.startPaneProps)
    spread(parts.separator, api.separatorProps)
    spread(parts.handle, api.handleProps)
    spread(parts.end, api.endPaneProps)
  }
}

type RailLink = { anchor: HTMLAnchorElement; icon: HTMLSpanElement; label: HTMLSpanElement; count: HTMLSpanElement | null; item: RailItem }

/**
 * The sections as a narrow column, enhanced from links:
 *
 *   <gg-rail label="Sections">
 *     <a href="/leads" data-icon="list" aria-current="page">Leads<span data-count>3</span></a>
 *     <a href="/reports" data-icon="chart">Reports</a>
 *     <a href="/settings" data-icon="settings" data-end>Settings</a>
 *   </gg-rail>
 *
 * The host is the landmark. A link marked `data-end` stands at the bottom.
 */
export class GgRailElement extends HTMLElement {
  static observedAttributes = ['label']

  #links: RailLink[] = []
  #spacer: HTMLSpanElement | null = null
  #id = ''

  connectedCallback(): void {
    if (this.#links.length === 0) {
      const anchors = [...this.querySelectorAll<HTMLAnchorElement>('a[href]')]
      if (anchors.length === 0) {
        console.warn('<gg-rail> expects <a href> items inside it.', this)
        return
      }
      this.#id = this.id || uid('gg-rail')
      this.#links = anchors.map((anchor) => this.#buildLink(anchor))
      const start = this.#links.filter((link) => !link.item.end).map((link) => link.anchor)
      const end = this.#links.filter((link) => link.item.end).map((link) => link.anchor)
      this.#spacer = end.length > 0 ? h('span') : null
      this.replaceChildren(...start, ...(this.#spacer ? [this.#spacer] : []), ...end)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #buildLink(anchor: HTMLAnchorElement): RailLink {
    const countNode = anchor.querySelector<HTMLSpanElement>('[data-count]')
    countNode?.remove()
    const text = anchor.textContent?.trim() ?? ''
    const icon = h('span')
    const label = h('span')
    label.textContent = text
    anchor.replaceChildren(icon, label, ...(countNode ? [countNode] : []))
    const iconName = anchor.dataset.icon as IconName
    // Taken off the anchor: a mask clips everything on its element.
    delete anchor.dataset.icon
    const end = anchor.hasAttribute('data-end')
    anchor.removeAttribute('data-end')
    return {
      anchor,
      icon,
      label,
      count: countNode,
      item: {
        label: text,
        href: anchor.getAttribute('href') ?? '',
        icon: iconName,
        count: countNode?.textContent ?? undefined,
        current: anchor.hasAttribute('aria-current') && anchor.getAttribute('aria-current') !== 'false',
        end,
      },
    }
  }

  #render(): void {
    if (this.#links.length === 0) return
    const api = connectRail({ id: this.#id, label: this.getAttribute('label') ?? '', items: this.#links.map((link) => link.item) }, domNormalizer)
    spread(this, { attrs: { ...api.rootProps.attrs, role: 'navigation' }, listeners: api.rootProps.listeners }, 'rail')
    if (this.#spacer) spread(this.#spacer, api.spacerProps)
    for (const link of this.#links) {
      const parts = api.getItemProps(link.item)
      spread(link.anchor, parts.itemProps)
      spread(link.icon, parts.iconProps)
      spread(link.label, parts.labelProps)
      if (link.count) spread(link.count, parts.countProps)
    }
  }
}

/**
 * One line of readings along the bottom of a tool:
 *
 *   <gg-status-bar label="Editor status">
 *     <span>main</span>
 *     <span data-tone="error">2 errors</span>
 *     <span data-spacer></span>
 *     <gg-button size="sm" emphasis="low"><button>UTF-8</button></gg-button>
 *   </gg-status-bar>
 *
 * The host is the strip. A child `<span>` is a reading, with a `data-tone` for
 * news; a `data-spacer` child sends what follows to the far end. Attribute: label.
 */
export class GgStatusBarElement extends HTMLElement {
  static observedAttributes = ['label']
  #observer: MutationObserver | null = null

  connectedCallback(): void {
    this.#render()
    this.#observer = new MutationObserver(() => this.#render())
    this.#observer.observe(this, { childList: true })
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect()
    this.#observer = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const api = connectStatusBar({ label: this.getAttribute('label') ?? undefined }, domNormalizer)
    spread(this, api.rootProps, 'status-bar')
    for (const child of this.children) {
      if (!(child instanceof HTMLElement)) continue
      if (child.hasAttribute('data-spacer')) spread(child, api.spacerProps, 'status-bar')
      else if (child.tagName === 'SPAN') spread(child, api.getItemProps((child.dataset.tone as StatusTone | undefined) ?? undefined), 'status-bar')
    }
  }
}

const define = (name: string, element: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, element)
}
define('gg-shell', GgShellElement)
define('gg-split', GgSplitElement)
define('gg-rail', GgRailElement)
define('gg-status-bar', GgStatusBarElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-shell': GgShellElement
    'gg-split': GgSplitElement
    'gg-rail': GgRailElement
    'gg-status-bar': GgStatusBarElement
  }
}
