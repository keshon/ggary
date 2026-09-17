import { connect, type SliderSize } from '@ggary/core/slider'
import { domNormalizer, onFormReset, uid, type Dict } from '@ggary/core'
import { h, spread } from '../../spread'
import type { FieldConsumer } from '../checkbox/choice'

const numberAttr = (element: Element, name: string) => {
  const text = element.getAttribute(name)
  return text === null || text === '' ? undefined : Number(text)
}

/**
 * Enhancement of a native range input:
 *
 *   <gg-slider label="Parallel agents" show-value>
 *     <input type="range" name="agents" min="0" max="16" value="6">
 *   </gg-slider>
 *
 * The input keeps its value, its bounds and its form participation; the host
 * becomes the root that carries the fill, and the number is added after the
 * input. Attributes: label, show-value, value-text, size, disabled, required,
 * invalid. Property: `formatValue` (value => words). Event: valuechange { value }.
 * Inside a <gg-field> the field pushes its control props in with applyField().
 */
export class GgSliderElement extends HTMLElement implements FieldConsumer {
  static observedAttributes = ['label', 'show-value', 'value-text', 'size', 'disabled', 'required', 'invalid']

  #input: HTMLInputElement | null = null
  #output: HTMLOutputElement | null = null
  #id = ''
  #field: Dict | null = null
  #native = { disabled: false, required: false }
  #format: ((value: number) => string) | null = null
  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#render())
    if (!this.#input) {
      const input = this.querySelector<HTMLInputElement>('input[type="range"]')
      if (!input) {
        console.warn('<gg-slider> expects an <input type="range"> inside it.', this)
        return
      }
      this.#input = input
      this.#id = this.id || uid('gg-slider')
      this.#native = { disabled: input.hasAttribute('disabled'), required: input.hasAttribute('required') }
      this.#output = h('output')
    }
    const field = this.closest('gg-field')
    if (field && 'refresh' in field) field.refresh()
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  applyField(props: Dict | null): void {
    this.#field = props
    if (this.isConnected) this.#render()
  }

  get value(): number {
    return Number(this.#input?.value ?? 0)
  }
  set value(next: number) {
    if (!this.#input) return
    this.#input.value = String(next)
    this.#render()
  }

  get formatValue(): ((value: number) => string) | null {
    return this.#format
  }
  set formatValue(next: ((value: number) => string) | null) {
    this.#format = next
    this.#render()
  }

  #render(): void {
    const input = this.#input
    const output = this.#output
    if (!input || !output) return
    const api = connect(
      {
        id: this.#id,
        inputId: input.id || undefined,
        // The browser's value, already clamped to the bounds and snapped to the step.
        value: Number(input.value),
        min: numberAttr(input, 'min'),
        max: numberAttr(input, 'max'),
        step: numberAttr(input, 'step'),
        label: this.getAttribute('label') ?? undefined,
        valueText: this.getAttribute('value-text') ?? undefined,
        showValue: this.hasAttribute('show-value'),
        size: (this.getAttribute('size') as SliderSize) ?? undefined,
        disabled: this.hasAttribute('disabled') || this.#native.disabled,
        required: this.hasAttribute('required') || this.#native.required,
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer,
      {
        field: this.#field ?? undefined,
        formatValue: this.#format ?? undefined,
        onValueChange: (value) => {
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
          this.#render()
        },
      }
    )
    spread(this, api.rootProps, 'slider')
    spread(input, api.inputProps)
    spread(output, api.outputProps)
    if (output.textContent !== api.valueLabel) output.textContent = api.valueLabel
    if (api.showValue && output.previousElementSibling !== input) input.after(output)
    if (!api.showValue && output.isConnected) output.remove()
  }
}

if (!customElements.get('gg-slider')) customElements.define('gg-slider', GgSliderElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-slider': GgSliderElement
  }
}
