import { connectCluster, connectContainer, connectGrid, connectStack, type FlowGap } from '@ggary/core/flow'
import { connect as connectPageHeader } from '@ggary/core/page-header'
import { connect as connectSection } from '@ggary/core/section'
import { domNormalizer, uid, type HeadingLevel, type RegionRank } from '@ggary/core'
import { h, spread } from '../../spread'

const gapOf = (element: Element) => (element.getAttribute('gap') as FlowGap | null) ?? undefined

/** A column: `<gg-stack gap="loose">`. Attribute: gap (tight, default, loose). */
export class GgStackElement extends HTMLElement {
  static observedAttributes = ['gap']
  connectedCallback(): void {
    this.#render()
  }
  attributeChangedCallback(): void {
    this.#render()
  }
  #render(): void {
    spread(this, connectStack({ gap: gapOf(this) }, domNormalizer).rootProps, 'stack')
  }
}

/**
 * A row that wraps: `<gg-cluster justify="between">`. A child with `data-spacer`
 * sends what follows to the far end. Attributes: gap, justify (start, end, between).
 */
export class GgClusterElement extends HTMLElement {
  static observedAttributes = ['gap', 'justify']
  connectedCallback(): void {
    this.#render()
  }
  attributeChangedCallback(): void {
    this.#render()
  }
  #render(): void {
    const api = connectCluster({ gap: gapOf(this), justify: (this.getAttribute('justify') as 'start' | 'end' | 'between' | null) ?? undefined }, domNormalizer)
    spread(this, api.rootProps, 'cluster')
    for (const spacer of this.querySelectorAll(':scope > [data-spacer]')) spread(spacer, api.spacerProps, 'cluster')
  }
}

/** Cards in columns: `<gg-grid columns="wide">`. Attributes: gap, columns (tight, default, wide). */
export class GgGridElement extends HTMLElement {
  static observedAttributes = ['gap', 'columns']
  connectedCallback(): void {
    this.#render()
  }
  attributeChangedCallback(): void {
    this.#render()
  }
  #render(): void {
    const columns = (this.getAttribute('columns') as 'tight' | 'default' | 'wide' | null) ?? undefined
    spread(this, connectGrid({ gap: gapOf(this), columns }, domNormalizer).rootProps, 'grid')
  }
}

/** The width a screen's content keeps: `<gg-container size="prose">`. Attribute: size (default, narrow, prose, full). */
export class GgContainerElement extends HTMLElement {
  static observedAttributes = ['size']
  connectedCallback(): void {
    this.#render()
  }
  attributeChangedCallback(): void {
    this.#render()
  }
  #render(): void {
    const size = (this.getAttribute('size') as 'default' | 'narrow' | 'prose' | 'full' | null) ?? undefined
    spread(this, connectContainer({ size }, domNormalizer).rootProps, 'container')
  }
}

const levelOf = (element: Element, fallback: HeadingLevel) => {
  const level = Number(element.getAttribute('heading-level'))
  return (level >= 1 && level <= 6 ? level : fallback) as HeadingLevel
}

/** Re-create the heading element when its level changes. */
const headingFor = (current: HTMLElement | null, tag: string) => (current?.localName === tag ? current : document.createElement(tag))

/**
 * The top of a screen:
 *
 *   <gg-page-header heading="Leads" description="Everyone the sales team is talking to.">
 *     <gg-breadcrumbs slot="context">…</gg-breadcrumbs>
 *     <gg-button slot="actions"><button>New lead</button></gg-button>
 *   </gg-page-header>
 *
 * Attributes: heading, description, heading-level (default 1).
 */
export class GgPageHeaderElement extends HTMLElement {
  static observedAttributes = ['heading', 'description', 'heading-level']
  #id = uid('gg-page')
  #parts: { context: HTMLDivElement; main: HTMLDivElement; title: HTMLElement | null; description: HTMLParagraphElement; actions: HTMLDivElement } | null = null

  connectedCallback(): void {
    if (!this.#parts) {
      const slotted = (name: string) => [...this.children].filter((child) => child.getAttribute('slot') === name)
      const context = h('div')
      context.append(...slotted('context'))
      const actions = h('div')
      actions.append(...slotted('actions'))
      this.#parts = { context, main: h('div'), title: null, description: h('p'), actions }
      this.replaceChildren(context, this.#parts.main, actions)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const parts = this.#parts
    if (!parts) return
    const description = this.getAttribute('description') ?? undefined
    const title = this.getAttribute('heading') ?? ''
    const api = connectPageHeader({ id: this.id || this.#id, title, description, headingLevel: levelOf(this, 1) }, domNormalizer)
    spread(this, api.rootProps, 'page-header')
    spread(parts.context, api.contextProps)
    spread(parts.main, api.mainProps)
    spread(parts.actions, api.actionsProps)
    parts.title = headingFor(parts.title, api.titleElement)
    spread(parts.title, api.titleProps)
    parts.title.textContent = title
    spread(parts.description, api.descriptionProps)
    parts.description.textContent = description ?? ''
    parts.main.replaceChildren(parts.title, ...(description ? [parts.description] : []))
    parts.context.hidden = parts.context.childElementCount === 0
    parts.actions.hidden = parts.actions.childElementCount === 0
  }
}

/**
 * A stretch of the page under its heading:
 *
 *   <gg-section heading="Notifications" description="Where we reach you.">
 *     <gg-button slot="actions" emphasis="minimal"><button>Reset</button></gg-button>
 *     … the body …
 *   </gg-section>
 *
 * Attributes: heading, description, heading-level (default 2), rank, region.
 */
export class GgSectionElement extends HTMLElement {
  static observedAttributes = ['heading', 'description', 'heading-level', 'rank', 'region']
  #id = uid('gg-section')
  #parts: { header: HTMLDivElement; title: HTMLElement | null; description: HTMLParagraphElement; actions: HTMLDivElement; body: HTMLDivElement } | null = null

  connectedCallback(): void {
    if (!this.#parts) {
      const actionNodes = [...this.children].filter((child) => child.getAttribute('slot') === 'actions')
      const actions = h('div')
      actions.append(...actionNodes)
      const body = h('div')
      body.append(...[...this.childNodes].filter((node) => !actionNodes.includes(node as Element)))
      const header = h('div')
      this.#parts = { header, title: null, description: h('p'), actions, body }
      this.replaceChildren(header, body)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const parts = this.#parts
    if (!parts) return
    const title = this.getAttribute('heading') ?? undefined
    const description = this.getAttribute('description') ?? undefined
    const api = connectSection(
      {
        id: this.id || this.#id,
        title,
        description,
        headingLevel: levelOf(this, 2),
        rank: (this.getAttribute('rank') as RegionRank | null) ?? undefined,
        region: this.hasAttribute('region'),
      },
      domNormalizer
    )
    spread(this, api.rootProps, 'section')
    spread(parts.header, api.headerProps)
    spread(parts.actions, api.actionsProps)
    spread(parts.body, api.bodyProps)
    parts.title = headingFor(parts.title, api.titleElement)
    spread(parts.title, api.titleProps)
    parts.title.textContent = title ?? ''
    spread(parts.description, api.descriptionProps)
    parts.description.textContent = description ?? ''
    const head: HTMLElement[] = [
      ...(title !== undefined ? [parts.title] : []),
      ...(parts.actions.childElementCount > 0 ? [parts.actions] : []),
      ...(description ? [parts.description] : []),
    ]
    parts.header.replaceChildren(...head)
    parts.header.hidden = head.length === 0
  }
}

const define = (name: string, element: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, element)
}
define('gg-stack', GgStackElement)
define('gg-cluster', GgClusterElement)
define('gg-grid', GgGridElement)
define('gg-container', GgContainerElement)
define('gg-page-header', GgPageHeaderElement)
define('gg-section', GgSectionElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-stack': GgStackElement
    'gg-cluster': GgClusterElement
    'gg-grid': GgGridElement
    'gg-container': GgContainerElement
    'gg-page-header': GgPageHeaderElement
    'gg-section': GgSectionElement
  }
}
