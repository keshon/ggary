import { connect, createPopoverMachine, type PopoverEvent, type PopoverPlacement, type PopoverState } from '@ggary/core/popover'
import { attachPopover, domNormalizer, uid, type AttachedPopover, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'

/** The slotted trigger, or the focusable element inside a wrapper such as <gg-button>. */
export function slottedTrigger(host: Element): { slot: HTMLElement | null; trigger: HTMLElement | null } {
  const slot = host.querySelector<HTMLElement>(':scope > [slot="trigger"]')
  const trigger = slot?.matches('button, a, input, [role="button"], [tabindex]')
    ? slot
    : (slot?.querySelector<HTMLElement>('button, a, input, [role="button"], [tabindex]') ?? slot)
  return { slot, trigger }
}

/**
 * A non-modal dialog anchored to its trigger:
 *
 *   <gg-popover heading="Filters" placement="bottom-start">
 *     <gg-button slot="trigger"><button>Filters</button></gg-button>
 *     <gg-checkbox><label><input type="checkbox"> Only mine</label></gg-checkbox>
 *   </gg-popover>
 *
 * The children become the content, which is shown in the top layer next to the
 * trigger. Attributes: open, heading, placement, persistent, close-button,
 * close-label. Methods: show(), close(), toggle(). Event: openchange.
 */
export class GgPopoverElement extends HTMLElement {
  static observedAttributes = ['open', 'heading', 'placement', 'persistent', 'close-button', 'close-label']

  #machine: Machine<PopoverState, PopoverEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #attached: AttachedPopover | null = null
  #reflecting = false

  #trigger: HTMLElement | null = null
  #content: HTMLDivElement | null = null
  #title: HTMLHeadingElement | null = null
  #close: HTMLButtonElement | null = null
  #closeIcon: HTMLSpanElement | null = null

  get open(): boolean {
    return this.#machine?.getState().open ?? this.hasAttribute('open')
  }
  set open(next: boolean) {
    this.toggleAttribute('open', next)
  }

  show(): void {
    this.#machine?.send({ type: 'OPEN', reason: 'api' })
  }
  close(): void {
    this.#machine?.send({ type: 'CLOSE', reason: 'api' })
  }
  toggle(): void {
    this.#machine?.send({ type: 'TOGGLE', reason: 'api' })
  }

  connectedCallback(): void {
    if (!this.#machine) {
      this.#build()
      this.#machine = createPopoverMachine({
        id: this.id || uid('gg-popover'),
        defaultOpen: this.hasAttribute('open'),
        ...this.#options(),
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
    this.#attached?.destroy()
    this.#attached = null
  }

  attributeChangedCallback(name: string): void {
    const machine = this.#machine
    if (!machine) return
    if (name === 'open') {
      if (!this.#reflecting) machine.send({ type: 'SYNC_OPEN', open: this.hasAttribute('open') })
    } else if (name === 'placement' || name === 'persistent') {
      machine.send({ type: 'SYNC_OPTIONS', ...this.#options() })
    }
    if (this.isConnected) this.#render()
  }

  #options() {
    const persistent = this.hasAttribute('persistent')
    return {
      placement: (this.getAttribute('placement') as PopoverPlacement) ?? undefined,
      closeOnEscape: !persistent,
      closeOnOutside: !persistent,
    }
  }

  #build(): void {
    const { slot, trigger } = slottedTrigger(this)
    this.#trigger = trigger
    this.#content = h('div')
    this.#title = h('h2')
    this.#close = h('button')
    this.#closeIcon = h('span')
    this.#close.append(this.#closeIcon)
    const children = Array.from(this.childNodes).filter((node) => node !== slot)
    this.#content.append(this.#title, this.#close, ...children)
    this.append(this.#content)
  }

  #render(): void {
    const machine = this.#machine
    const content = this.#content
    if (!machine || !content) return

    const state = machine.getState()
    const heading = this.getAttribute('heading')
    const api = connect(state, machine.send, domNormalizer, {
      title: heading !== null,
      closeLabel: this.getAttribute('close-label') ?? undefined,
    })

    if (this.#trigger) spread(this.#trigger, api.triggerProps, 'popover')
    spread(content, api.contentProps)
    spread(this.#title!, api.titleProps)
    this.#title!.textContent = heading ?? ''
    this.#title!.hidden = heading === null
    spread(this.#close!, api.closeProps)
    spread(this.#closeIcon!, api.closeIconProps)
    this.#close!.hidden = !this.hasAttribute('close-button')

    const options = { placement: state.placement, closeOnEscape: state.closeOnEscape, closeOnOutside: state.closeOnOutside }
    if (state.open && !this.#attached && this.#trigger) {
      this.#attached = attachPopover(this.#trigger, content, {
        ...options,
        gutter: 6,
        manageFocus: true,
        onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
      })
    } else if (!state.open && this.#attached) {
      this.#attached.destroy()
      this.#attached = null
    } else {
      this.#attached?.update(options)
    }
  }
}

if (!customElements.get('gg-popover')) customElements.define('gg-popover', GgPopoverElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-popover': GgPopoverElement
  }
}
