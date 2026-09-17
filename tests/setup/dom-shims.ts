/**
 * The smallest stand-ins for platform APIs jsdom does not have, so the jsdom
 * run can exercise the adapters' wiring around them.
 *
 * They are NOT the behaviour: no top layer, no inert page, no :modal, no
 * focus trap. What those do is tested in the browser project only, and a
 * test that would pass here merely because of a shim belongs there.
 */

const focusables = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// --- <dialog> -------------------------------------------------------------------
const dialog = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>

if (typeof dialog.showModal !== 'function') {
  const focusInside = (el: HTMLElement) => {
    const target = el.querySelector<HTMLElement>('[autofocus]') ?? el.querySelector<HTMLElement>(focusables) ?? el
    target.focus()
  }

  Object.defineProperty(dialog, 'returnValue', {
    configurable: true,
    get(this: HTMLElement & { _returnValue?: string }) {
      return this._returnValue ?? ''
    },
    set(this: HTMLElement & { _returnValue?: string }, value: string) {
      this._returnValue = value
    },
  })

  dialog.show = function (this: HTMLDialogElement) {
    if (this.open) return
    this.setAttribute('open', '')
    focusInside(this)
  }

  dialog.showModal = function (this: HTMLDialogElement) {
    if (this.open) throw new DOMException('The dialog is already open.', 'InvalidStateError')
    if (!this.isConnected) throw new DOMException('The dialog is not connected.', 'InvalidStateError')
    this.setAttribute('open', '')
    focusInside(this)
  }

  dialog.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return
    if (returnValue !== undefined) this.returnValue = returnValue
    this.removeAttribute('open')
    // A queued task in browsers: listeners removed before close() hear nothing.
    setTimeout(() => this.dispatchEvent(new Event('close')))
  }
}

// --- popover --------------------------------------------------------------------
const element = HTMLElement.prototype as HTMLElement & Record<string, unknown>

if (typeof element.showPopover !== 'function') {
  const open = new WeakSet<HTMLElement>()
  const toggle = (el: HTMLElement, next: boolean) => {
    if (open.has(el) === next) return
    if (next) open.add(el)
    else open.delete(el)
    el.dispatchEvent(Object.assign(new Event('toggle'), { oldState: next ? 'closed' : 'open', newState: next ? 'open' : 'closed' }))
  }
  element.showPopover = function (this: HTMLElement) {
    toggle(this, true)
  }
  element.hidePopover = function (this: HTMLElement) {
    toggle(this, false)
  }
  element.togglePopover = function (this: HTMLElement, force?: boolean) {
    const next = force ?? !open.has(this)
    toggle(this, next)
    return next
  }
  /** jsdom cannot match :popover-open; tests read this instead. */
  ;(globalThis as { isPopoverOpen?: (el: HTMLElement) => boolean }).isPopoverOpen = (el) => open.has(el)
}
