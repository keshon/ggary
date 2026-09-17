import { connect, keepRegionOpen, toaster as pageToaster, type Toast, type Toaster, type ToastPlacement } from '@ggary/core/toast'
import { domNormalizer, type DomProps } from '@ggary/core'
import { h, reconcileChildren, spread } from '../../spread'

/**
 * The region toasts appear in:
 *
 *   <gg-toaster placement="bottom-end"></gg-toaster>
 *   import { toast } from '@ggary/elements'
 *   toast({ tone: 'ok', title: 'Saved' })
 *
 * One per page, anywhere: it lives in the top layer. Attributes: placement,
 * label, close-label. Property: `toaster`, a queue of its own (default: the
 * page's, which `toast()` adds to).
 */
export class GgToasterElement extends HTMLElement {
  static observedAttributes = ['placement', 'label', 'close-label']

  #toaster: Toaster = pageToaster
  #unsubscribe: (() => void) | null = null

  #region: HTMLElement | null = null
  #polite: HTMLDivElement | null = null
  #assertive: HTMLDivElement | null = null
  #list: HTMLOListElement | null = null
  #items = new Map<string, HTMLLIElement>()
  #announced = 0
  /** What each toast last rendered, so an unchanged toast keeps its nodes (and focus in its buttons). */
  #rendered = new WeakMap<HTMLLIElement, string>()

  get toaster(): Toaster {
    return this.#toaster
  }
  set toaster(next: Toaster) {
    this.#toaster = next ?? pageToaster
    if (this.isConnected) {
      this.#unsubscribe?.()
      this.#unsubscribe = this.#toaster.subscribe(() => this.#render())
      this.#render()
    }
  }

  connectedCallback(): void {
    if (!this.#region) {
      this.#region = h('section')
      this.#polite = h('div')
      this.#assertive = h('div')
      this.#list = h('ol')
      this.#region.append(this.#polite, this.#assertive, this.#list)
      this.append(this.#region)
    }
    this.#unsubscribe = this.#toaster.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const region = this.#region
    if (!region) return
    const state = this.#toaster.getState()
    const api = connect(state, this.#toaster, domNormalizer, {
      placement: (this.getAttribute('placement') as ToastPlacement) ?? undefined,
      label: this.getAttribute('label') ?? undefined,
      closeLabel: this.getAttribute('close-label') ?? undefined,
    })

    spread(region, api.regionProps)
    spread(this.#polite!, api.politeProps)
    spread(this.#assertive!, api.assertiveProps)
    spread(this.#list!, api.listProps)
    keepRegionOpen(region)

    // A new message replaces the announcer's child: an addition, which is what gets spoken.
    if (state.announcement.nonce !== this.#announced) {
      this.#announced = state.announcement.nonce
      this.#polite!.replaceChildren(...(api.politeText ? [h('p', undefined, [api.politeText])] : []))
      this.#assertive!.replaceChildren(...(api.assertiveText ? [h('p', undefined, [api.assertiveText])] : []))
    }

    const items = new Map<string, HTMLLIElement>()
    const order = api.toasts.map((toast) => {
      const item = this.#items.get(toast.id) ?? h('li')
      items.set(toast.id, item)
      this.#renderToast(item, toast, api)
      return item
    })
    this.#items = items
    reconcileChildren(this.#list!, order)
  }

  #renderToast(item: HTMLLIElement, toast: Toast, api: ReturnType<typeof connect<DomProps>>): void {
    spread(item, api.getToastProps(toast))
    const signature = JSON.stringify([toast.title, toast.text, toast.tone, toast.action?.label])
    if (this.#rendered.get(item) !== signature) {
      const parts: Element[] = []
      if (toast.tone) parts.push(h('span', api.getIconProps(toast)))
      const body = h('div', api.bodyProps, [h('p', api.titleProps, [toast.title])])
      if (toast.text) body.append(h('p', api.textProps, [toast.text]))
      parts.push(body)
      if (toast.action) parts.push(h('button', api.getActionProps(toast), [toast.action.label]))
      parts.push(h('button', api.getCloseProps(toast), [h('span', api.closeIconProps)]))
      item.replaceChildren(...parts)
      this.#rendered.set(item, signature)
      return
    }
    // Same content: refresh the handlers, which close over the current toast.
    const action = item.querySelector<HTMLElement>(':scope > [data-part="action"]')
    if (action) spread(action, api.getActionProps(toast))
    spread(item.querySelector(':scope > [data-part="close"]')!, api.getCloseProps(toast))
  }
}

if (!customElements.get('gg-toaster')) customElements.define('gg-toaster', GgToasterElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-toaster': GgToasterElement
  }
}
