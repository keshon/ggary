import { connect, createFieldMachine, type FieldEvent, type FieldState } from '@ggary/core/field'
import { connect as connectInput, type InputSize, type InputType } from '@ggary/core/input'
import { onFormReset, domNormalizer, uid, type Autosize, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'
import { applyTextarea, textareaProps } from '../textarea/textarea.element'
import type { FieldConsumer } from '../checkbox/choice'

/**
 * Light-DOM enhancement around a native control:
 *
 *   <gg-field label="Email" hint="We never share it" error="Enter a valid address">
 *     <input type="email" name="email" required>
 *   </gg-field>
 *
 * The control is server markup and keeps working without JS. The element adds a
 * label before it and a hint/error slot after it, wires ids and ARIA between
 * them, and validates on the :user-invalid rule. The host element is the field
 * root.
 *
 * `required`, `disabled` and `readonly` may sit on the control (the natural
 * HTML) or on the field; either marks the field.
 */
export class GgFieldElement extends HTMLElement {
  static observedAttributes = ['label', 'hint', 'error', 'invalid', 'required', 'disabled', 'readonly', 'size']

  #machine: Machine<FieldState, FieldEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #id = ''
  #control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null
  #label: HTMLLabelElement | null = null
  #hint: HTMLDivElement | null = null
  #error: HTMLDivElement | null = null
  /** The control's own flags, read once before this element first writes to it. */
  #native = { required: false, disabled: false, readOnly: false }
  #autosize: Autosize | null = null

  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    // A reset form starts over: no error until the user leaves the control again.
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#machine?.send({ type: 'RESET' }))
    // Moved, not new: the parts are already in place, only the subscription
    // (and auto-resize) went away on disconnect.
    if (this.#machine) {
      this.#unsubscribe = this.#machine.subscribe(() => this.#render())
      this.#render()
      return
    }
    this.#control = this.querySelector('input, textarea, select')
    if (!this.#control) {
      console.warn('<gg-field> expects an input, textarea or select inside it.', this)
      return
    }
    // The host is the field root and the root's id prefixes every part's, so
    // an id the page gave the element is adopted rather than overwritten.
    this.#id = this.id || uid('gg-field')
    const control = this.#control
    this.#native = {
      required: control.hasAttribute('required'),
      disabled: control.hasAttribute('disabled'),
      readOnly: control.hasAttribute('readonly'),
    }

    this.#machine = createFieldMachine({ id: this.#id, ...this.#flags() })

    this.#label = h('label')
    this.#hint = h('div')
    this.#error = h('div')
    this.prepend(this.#label)
    this.append(this.#hint, this.#error)

    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
    this.#unsubscribe?.()
    this.#unsubscribe = null
    this.#autosize?.destroy()
    this.#autosize = null
  }

  /**
   * Render again. A <gg-input> or <gg-textarea> inside the field calls this when
   * its own attributes change, since the field is what applies them.
   */
  refresh(): void {
    if (this.isConnected) this.#render()
  }

  attributeChangedCallback(name: string): void {
    if (!this.#machine) return
    if (['invalid', 'required', 'disabled', 'readonly'].includes(name)) {
      this.#machine.send({ type: 'SYNC', ...this.#flags() })
    }
    this.#render()
  }

  /**
   * The owner-declared flags, from the field or from the control's markup. The
   * markup is the snapshot taken at connect: after the first render the
   * control's attributes are this element's own output, and reading them back
   * would make a flag impossible to remove.
   */
  #flags() {
    const native = this.#native
    return {
      invalid: this.hasAttribute('invalid'),
      required: this.hasAttribute('required') || native.required,
      disabled: this.hasAttribute('disabled') || native.disabled,
      readOnly: this.hasAttribute('readonly') || native.readOnly,
    }
  }

  #render(): void {
    const machine = this.#machine
    const control = this.#control
    if (!machine || !control) return

    const labelText = this.getAttribute('label')
    const hintText = this.getAttribute('hint')
    const api = connect(machine.getState(), machine.send, domNormalizer, {
      hint: hintText !== null,
      error: this.getAttribute('error') ?? undefined,
    })

    spread(this, api.rootProps)

    spread(this.#label!, api.labelProps)
    this.#label!.textContent = labelText ?? ''
    this.#label!.hidden = labelText === null

    spread(this.#hint!, api.hintProps)
    this.#hint!.textContent = hintText ?? ''
    if (hintText === null) this.#hint!.hidden = true

    spread(this.#error!, api.errorProps)
    this.#error!.textContent = api.errorText

    if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
      // A choice control is several parts, so its element renders them and this
      // field hands it the props to merge. Until that element has upgraded there
      // is nobody to hand them to; it asks with refresh() once it has.
      const owner = control.closest('gg-checkbox, gg-switch')
      if (!owner) spread(control, domNormalizer(api.control))
      else if ('applyField' in owner) (owner as unknown as FieldConsumer).applyField(api.control)
    } else if (control instanceof HTMLInputElement) {
      // This field owns the control, so it applies the input contract too —
      // reading size from a <gg-input> wrapper if there is one (that wrapper
      // stands down inside a field).
      const size = control.closest('gg-input')?.getAttribute('size') ?? this.getAttribute('size')
      const input = connectInput(
        { type: (control.getAttribute('type') as InputType) ?? undefined, size: (size as InputSize) ?? undefined },
        domNormalizer,
        { field: api.control }
      )
      spread(control, input.rootProps)
    } else if (control instanceof HTMLTextAreaElement) {
      const props = textareaProps(control.closest('gg-textarea'), this)
      this.#autosize = applyTextarea(control, props, this.#autosize, api.control)
    } else {
      spread(control, domNormalizer(api.control))
    }
  }
}

if (!customElements.get('gg-field')) customElements.define('gg-field', GgFieldElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-field': GgFieldElement
  }
}
