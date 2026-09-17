import { connect, createDialogMachine, type DialogChangeReason, type DialogEvent, type DialogSize, type DialogState } from '@ggary/core/dialog'
import { attachDialog, domNormalizer, uid, type AttachedDialog, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 * A native <dialog> built around the author's content:
 *
 *   <gg-dialog heading="Delete project?" description="This cannot be undone.">
 *     <button slot="trigger">Delete…</button>
 *     <p>Everything in "Atlas" goes, including its history.</p>
 *     <footer>
 *       <form method="dialog">
 *         <button value="cancel">Cancel</button>
 *         <button value="delete">Delete</button>
 *       </form>
 *     </footer>
 *   </gg-dialog>
 *
 * A child with `slot="trigger"` opens it and stays where it is. A direct
 * <footer> child becomes the footer; every other child becomes the body. A
 * <form method="dialog"> closes it natively, and its button's value arrives as
 * `returnValue` in the `openchange` event.
 *
 * `heading`, not `title`: a title attribute on the host would give the whole
 * element a browser tooltip.
 *
 * Attributes: open, heading, description, size, alert (role alertdialog),
 * non-modal, persistent (neither Escape nor an outside press closes it),
 * no-close-button, close-label. Methods: show(), close().
 */
export class GgDialogElement extends HTMLElement {
  static observedAttributes = [
    'open', 'heading', 'description', 'size', 'alert', 'non-modal', 'persistent', 'no-close-button', 'close-label',
  ]

  #machine: Machine<DialogState, DialogEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #attached: AttachedDialog | null = null
  /** Set while this element writes its own `open` attribute, so the write is not read back as a request. */
  #reflecting = false

  #trigger: HTMLElement | null = null
  #content: HTMLDialogElement | null = null
  #header: HTMLElement | null = null
  #title: HTMLHeadingElement | null = null
  #description: HTMLParagraphElement | null = null
  #close: HTMLButtonElement | null = null
  #closeIcon: HTMLSpanElement | null = null
  #body: HTMLDivElement | null = null
  #footer: HTMLElement | null = null

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

  connectedCallback(): void {
    if (!this.#machine) {
      this.#build()
      this.#machine = createDialogMachine({
        id: this.id || uid('gg-dialog'),
        defaultOpen: this.hasAttribute('open'),
        ...this.#options(),
        onOpenChange: (open, { reason, returnValue }) => this.#reportChange(open, reason, returnValue ?? ''),
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
    } else if (['alert', 'non-modal', 'persistent'].includes(name)) {
      machine.send({ type: 'SYNC_OPTIONS', ...this.#options() })
    }
    if (this.isConnected) this.#render()
  }

  #options() {
    const persistent = this.hasAttribute('persistent')
    return {
      modal: !this.hasAttribute('non-modal'),
      role: this.hasAttribute('alert') ? ('alertdialog' as const) : ('dialog' as const),
      closeOnEscape: !persistent,
      closeOnOutside: !persistent,
    }
  }

  #reportChange(open: boolean, reason: DialogChangeReason, returnValue: string): void {
    this.#reflecting = true
    this.toggleAttribute('open', open)
    this.#reflecting = false
    this.dispatchEvent(new CustomEvent('openchange', { detail: { open, reason, returnValue }, bubbles: true }))
  }

  #build(): void {
    // The slotted child may be the button itself or a wrapper around one, such
    // as <gg-button>; the ARIA belongs on the element that takes focus.
    const slotted = this.querySelector<HTMLElement>(':scope > [slot="trigger"]')
    this.#trigger = slotted?.matches('button, a, [role="button"]')
      ? slotted
      : (slotted?.querySelector<HTMLElement>('button, a, [role="button"]') ?? slotted)
    this.#footer = this.querySelector<HTMLElement>(':scope > footer')

    this.#content = h('dialog')
    this.#header = h('header')
    this.#title = h('h2')
    this.#description = h('p')
    this.#close = h('button')
    this.#closeIcon = h('span')
    this.#body = h('div')

    this.#close.append(this.#closeIcon)
    this.#header.append(this.#title, this.#description, this.#close)
    const bodyNodes = Array.from(this.childNodes).filter((node) => node !== slotted && node !== this.#footer)
    this.#body.append(...bodyNodes)
    this.#content.append(this.#header, this.#body)
    if (this.#footer) this.#content.append(this.#footer)
    this.append(this.#content)
  }

  #render(): void {
    const machine = this.#machine
    const content = this.#content
    if (!machine || !content) return

    const state = machine.getState()
    const heading = this.getAttribute('heading')
    const description = this.getAttribute('description')
    const api = connect(state, machine.send, domNormalizer, {
      title: heading !== null,
      description: description !== null,
      size: (this.getAttribute('size') as DialogSize) ?? undefined,
      closeLabel: this.getAttribute('close-label') ?? undefined,
    })

    if (this.#trigger) spread(this.#trigger, api.triggerProps, 'dialog')
    spread(content, api.contentProps)
    spread(this.#header!, api.headerProps)
    spread(this.#title!, api.titleProps)
    this.#title!.textContent = heading ?? ''
    this.#title!.hidden = heading === null
    spread(this.#description!, api.descriptionProps)
    this.#description!.textContent = description ?? ''
    this.#description!.hidden = description === null
    spread(this.#close!, api.closeProps)
    spread(this.#closeIcon!, api.closeIconProps)
    this.#close!.hidden = this.hasAttribute('no-close-button')
    this.#header!.hidden = heading === null && this.#close!.hidden
    spread(this.#body!, api.bodyProps)
    if (this.#footer) spread(this.#footer, api.footerProps)

    this.#syncOpen(state, api.ids.trigger)
  }

  #syncOpen(state: DialogState, triggerId: string): void {
    const options = { modal: state.modal, closeOnEscape: state.closeOnEscape, closeOnOutside: state.closeOnOutside }
    if (state.open && !this.#attached) {
      this.#attached = attachDialog(this.#content!, {
        ...options,
        onDismiss: (reason) => this.#machine!.send({ type: 'CLOSE', reason }),
        onNativeClose: (returnValue) => this.#machine!.send({ type: 'CLOSE', reason: 'native', returnValue }),
        exclude: [this.#trigger ?? document.getElementById(triggerId)],
        finalFocus: this.#trigger ?? document.getElementById(triggerId),
      })
    } else if (!state.open && this.#attached) {
      this.#attached.destroy()
      this.#attached = null
    } else {
      this.#attached?.update(options)
    }
  }
}

if (!customElements.get('gg-dialog')) customElements.define('gg-dialog', GgDialogElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-dialog': GgDialogElement
  }
}
