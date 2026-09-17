import { connect, type TextareaProps, type TextareaResize, type TextareaSize } from '@ggary/core/textarea'
import { onFormReset, attachAutosize, domNormalizer, type Autosize, type AutosizeOptions, type Dict } from '@ggary/core'
import { spread } from '../../spread'

/**
 * The textarea contract as attributes. `wrapper` is a <gg-textarea>, if any;
 * `field` a <gg-field>, whose `size` applies when the wrapper sets none.
 */
export function textareaProps(wrapper: Element | null, field?: Element): TextareaProps {
  const maxRows = Number(wrapper?.getAttribute('max-rows'))
  return {
    size: (wrapper?.getAttribute('size') ?? field?.getAttribute('size') ?? undefined) as TextareaSize | undefined,
    resize: (wrapper?.getAttribute('resize') ?? undefined) as TextareaResize | undefined,
    autoResize: Boolean(wrapper?.hasAttribute('autoresize')),
    maxRows: maxRows > 0 ? maxRows : undefined,
    invalid: Boolean(wrapper?.hasAttribute('invalid')),
  }
}

/**
 * Apply the contract to a native textarea and keep auto-resize in step with it.
 * Returns the autosize instance to pass back in next time (null when off).
 */
export function applyTextarea(
  control: HTMLTextAreaElement,
  props: TextareaProps,
  current: Autosize | null,
  field?: Dict
): Autosize | null {
  const api = connect(props, domNormalizer, { field })
  spread(control, api.rootProps)
  return syncAutosize(current, control, api.autosize)
}

function syncAutosize(current: Autosize | null, control: HTMLTextAreaElement, options: AutosizeOptions | null) {
  if (!options) {
    current?.destroy()
    return null
  }
  if (!current) return attachAutosize(control, options)
  current.setOptions(options)
  return current
}

/**
 * Light-DOM enhancement, like <gg-input>:
 *
 *   <gg-textarea autoresize max-rows="8"><textarea name="bio" rows="3"></textarea></gg-textarea>
 *
 * Inside a <gg-field> it stands down, for the same reason <gg-input> does; the
 * field reads these attributes and applies the contract, auto-resize included.
 */
export class GgTextareaElement extends HTMLElement {
  static observedAttributes = ['size', 'invalid', 'resize', 'autoresize', 'max-rows']

  #textarea: HTMLTextAreaElement | null = null
  #autosize: Autosize | null = null

  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    // A reset writes the value without an input event: measure it again.
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#autosize?.update())
    const field = this.closest('gg-field')
    if (field) return
    this.#textarea = this.querySelector('textarea')
    if (!this.#textarea) {
      console.warn('<gg-textarea> expects a <textarea> child to enhance.', this)
      return
    }
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
    this.#autosize?.destroy()
    this.#autosize = null
  }

  attributeChangedCallback(): void {
    // Inside a field the field renders; tell it something changed.
    const field = this.closest('gg-field')
    if (field) {
      if ('refresh' in field) field.refresh()
    }
    else if (this.#textarea && this.isConnected) this.#render()
  }

  /** Re-measure after setting the textarea's value from code. */
  measure(): void {
    this.#autosize?.update()
  }

  #render(): void {
    this.#autosize = applyTextarea(this.#textarea!, textareaProps(this), this.#autosize)
  }
}

if (!customElements.get('gg-textarea')) customElements.define('gg-textarea', GgTextareaElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-textarea': GgTextareaElement
  }
}
