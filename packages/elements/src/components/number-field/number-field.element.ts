import { connect, readNumber, type NumberFieldSize } from '@ggary/core/number-field'
import { attachScrub, domNormalizer, onFormReset, uid, type Dict } from '@ggary/core'
import { h, spread } from '../../spread'
import type { FieldConsumer } from '../checkbox/choice'

const numberAttr = (element: Element, name: string) => {
  const text = element.getAttribute(name)
  return text === null || text === '' ? undefined : Number(text)
}

/**
 * Enhancement of a native number input:
 *
 *   <gg-number-field axis="X" label="Position X">
 *     <input type="number" name="x" value="128">
 *   </gg-number-field>
 *
 * The axis letter is added before the input and drags the value (Shift ×10,
 * Alt ×0.1). Attributes: axis, label, size, disabled, readonly, required,
 * invalid. Property: value (number | null). Event: valuechange { value }, beside
 * the native input and change events. Inside a <gg-field> the field pushes its
 * control props in with applyField().
 */
export class GgNumberFieldElement extends HTMLElement implements FieldConsumer {
  static observedAttributes = ['axis', 'label', 'size', 'disabled', 'readonly', 'required', 'invalid']

  #input: HTMLInputElement | null = null
  #axis: HTMLSpanElement | null = null
  #id = ''
  #field: Dict | null = null
  #native = { disabled: false, readOnly: false, required: false }
  #stopReset: (() => void) | null = null
  #stopScrub: (() => void) | null = null

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#render())
    if (!this.#input) {
      const input = this.querySelector<HTMLInputElement>('input[type="number"]')
      if (!input) {
        console.warn('<gg-number-field> expects an <input type="number"> inside it.', this)
        return
      }
      this.#input = input
      this.#id = this.id || uid('gg-number')
      this.#native = {
        disabled: input.hasAttribute('disabled'),
        readOnly: input.hasAttribute('readonly'),
        required: input.hasAttribute('required'),
      }
      this.#axis = h('span')
    }
    this.#stopScrub?.()
    this.#stopScrub = attachScrub(this.#axis!, () => this.#input)
    const field = this.closest('gg-field')
    if (field && 'refresh' in field) field.refresh()
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
    this.#stopScrub?.()
    this.#stopScrub = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  applyField(props: Dict | null): void {
    this.#field = props
    if (this.isConnected) this.#render()
  }

  get value(): number | null {
    return this.#input ? readNumber(this.#input) : null
  }
  set value(next: number | null) {
    if (!this.#input) return
    this.#input.value = next === null ? '' : String(next)
  }

  #render(): void {
    const input = this.#input
    const axis = this.#axis
    if (!input || !axis) return
    const api = connect(
      {
        id: this.#id,
        inputId: input.id || undefined,
        min: numberAttr(input, 'min'),
        max: numberAttr(input, 'max'),
        step: numberAttr(input, 'step'),
        label: this.getAttribute('label') ?? undefined,
        axis: this.getAttribute('axis') ?? undefined,
        size: (this.getAttribute('size') as NumberFieldSize) ?? undefined,
        disabled: this.hasAttribute('disabled') || this.#native.disabled,
        readOnly: this.hasAttribute('readonly') || this.#native.readOnly,
        required: this.hasAttribute('required') || this.#native.required,
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer,
      {
        field: this.#field ?? undefined,
        onValueChange: (value) => {
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
        },
      }
    )
    spread(this, api.rootProps, 'number-field')
    spread(axis, api.axisProps)
    if (axis.textContent !== api.axis) axis.textContent = api.axis
    spread(input, api.inputProps)
    if (api.showAxis && axis.nextElementSibling !== input) input.before(axis)
    if (!api.showAxis && axis.isConnected) axis.remove()
  }
}

if (!customElements.get('gg-number-field')) customElements.define('gg-number-field', GgNumberFieldElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-number-field': GgNumberFieldElement
  }
}
