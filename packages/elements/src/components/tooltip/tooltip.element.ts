import { connect, createTooltipMachine, type TooltipEvent, type TooltipPlacement, type TooltipState } from '@ggary/core/tooltip'
import { attachPopover, domNormalizer, uid, type AttachedPopover, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'

const focusableSelector = 'button, a, input, select, textarea, [role="button"], [tabindex]'

/**
 * Describes the element it wraps:
 *
 *   <gg-tooltip content="Copy link">
 *     <gg-button><button aria-label="Copy link">…</button></gg-button>
 *   </gg-tooltip>
 *
 * The first focusable descendant is the trigger. The tooltip text comes from
 * the `content` attribute and is always in the page, hidden, so a screen
 * reader reads it as the trigger's description. Attributes: content,
 * placement, open-delay, close-delay, disabled. Event: openchange.
 */
export class GgTooltipElement extends HTMLElement {
  static observedAttributes = ['content', 'placement', 'open-delay', 'close-delay', 'disabled']

  #machine: Machine<TooltipState, TooltipEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #attached: AttachedPopover | null = null
  #trigger: HTMLElement | null = null
  #content: HTMLDivElement | null = null

  connectedCallback(): void {
    if (!this.#machine) {
      this.#trigger = this.querySelector<HTMLElement>(focusableSelector)
      if (!this.#trigger) {
        console.warn('<gg-tooltip> expects a focusable element inside it to describe.', this)
        return
      }
      this.#content = h('div')
      this.append(this.#content)
      this.#machine = createTooltipMachine({
        id: this.id || uid('gg-tooltip'),
        ...this.#options(),
        onOpenChange: (open, details) =>
          this.dispatchEvent(new CustomEvent('openchange', { detail: { open, ...details }, bubbles: true })),
      })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#machine?.send({ type: 'DESTROY' })
    this.#unsubscribe?.()
    this.#unsubscribe = null
    this.#attached?.destroy()
    this.#attached = null
  }

  attributeChangedCallback(): void {
    if (!this.#machine) return
    this.#machine.send({ type: 'SYNC_OPTIONS', ...this.#options() })
    if (this.isConnected) this.#render()
  }

  #options() {
    const number = (name: string) => {
      const value = this.getAttribute(name)
      return value === null || value === '' || Number.isNaN(Number(value)) ? undefined : Number(value)
    }
    return {
      placement: (this.getAttribute('placement') as TooltipPlacement) ?? undefined,
      openDelay: number('open-delay'),
      closeDelay: number('close-delay'),
      disabled: this.hasAttribute('disabled'),
    }
  }

  #render(): void {
    const machine = this.#machine
    const content = this.#content
    const trigger = this.#trigger
    if (!machine || !content || !trigger) return

    const state = machine.getState()
    const api = connect(state, machine.send, domNormalizer)
    spread(trigger, api.triggerProps, 'tooltip')
    spread(content, api.contentProps)
    content.textContent = this.getAttribute('content') ?? ''

    if (state.open && !this.#attached) {
      this.#attached = attachPopover(trigger, content, {
        placement: state.placement,
        gutter: 6,
        passive: true,
        closeOnOutside: false,
        onDismiss: () => machine.send({ type: 'ESCAPE' }),
      })
    } else if (!state.open && this.#attached) {
      this.#attached.destroy()
      this.#attached = null
    } else {
      this.#attached?.update({ placement: state.placement })
    }
  }
}

if (!customElements.get('gg-tooltip')) customElements.define('gg-tooltip', GgTooltipElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-tooltip': GgTooltipElement
  }
}
