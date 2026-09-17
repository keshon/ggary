import { connect as connectCheckbox, type CheckedState } from '@ggary/core/checkbox'
import { connect as connectSwitch } from '@ggary/core/switch'
import { onFormReset, domNormalizer, type Dict } from '@ggary/core'
import { buildChoice, renderChoice, type ChoiceDom, type FieldConsumer } from './choice'

/**
 * Light-DOM enhancement of a native checkbox:
 *
 *   <gg-checkbox><label><input type="checkbox" name="terms" required> I agree</label></gg-checkbox>
 *
 * The input keeps its checked state, its name and its form participation; the
 * element adds the drawn mark and the state attributes. Host attributes:
 * `indeterminate`, `invalid`, `readonly` (none of which a checkbox has natively),
 * and `disabled` / `required`, which may equally sit on the input.
 *
 * INSIDE A <gg-field> THE ELEMENT STILL RENDERS, unlike <gg-input>: its
 * structure is several parts, not one element's attributes. The field pushes
 * its control props in with `applyField()` and the element merges them.
 */
abstract class ChoiceElement extends HTMLElement implements FieldConsumer {
  static observedAttributes = ['indeterminate', 'invalid', 'readonly', 'disabled', 'required']

  protected dom: ChoiceDom | null = null
  #field: Dict | null = null
  /** The input's own flags, read before this element first writes to it — as <gg-field> does. */
  #native = { disabled: false, required: false }

  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    // The browser resets the input itself; the state attributes need a render.
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.render())
    if (!this.dom) {
      const input = this.querySelector<HTMLInputElement>('input[type="checkbox"]')
      if (!input) {
        console.warn(`<${this.localName}> expects an <input type="checkbox"> inside it.`, this)
        return
      }
      this.#native = { disabled: input.hasAttribute('disabled'), required: input.hasAttribute('required') }
      this.dom = buildChoice(this, input)
    }
    const field = this.closest('gg-field')
    // The field renders first and pushes its props; ask again now that the
    // parts exist, in case this element was upgraded after the field was. A
    // field not yet upgraded has no refresh(), and will push once it is.
    if (field && 'refresh' in field) field.refresh()
    this.render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render()
  }

  applyField(props: Dict | null): void {
    this.#field = props
    if (this.isConnected) this.render()
  }

  get checked(): boolean {
    return this.dom?.input.checked ?? false
  }
  set checked(next: boolean) {
    if (!this.dom) return
    this.dom.input.checked = next
    this.render()
  }

  protected get fieldProps(): Dict | undefined {
    return this.#field ?? undefined
  }

  /** Flags from the host or from the markup. After the first render the input's attributes are this element's output. */
  protected get flags() {
    return {
      disabled: this.hasAttribute('disabled') || this.#native.disabled,
      required: this.hasAttribute('required') || this.#native.required,
      invalid: this.hasAttribute('invalid'),
      readOnly: this.hasAttribute('readonly'),
    }
  }

  /** The user toggled it: tell the page, then show it. */
  protected changed(checked: boolean): void {
    this.dispatchEvent(new CustomEvent('checkedchange', { detail: { checked }, bubbles: true }))
    this.render()
  }

  protected abstract render(): void
}

export class GgCheckboxElement extends ChoiceElement {
  get indeterminate(): boolean {
    return this.hasAttribute('indeterminate')
  }
  set indeterminate(next: boolean) {
    this.toggleAttribute('indeterminate', next)
  }

  protected render(): void {
    const dom = this.dom
    if (!dom) return
    const checked: CheckedState = this.hasAttribute('indeterminate') ? 'indeterminate' : dom.input.checked
    const api = connectCheckbox(
      { checked, ...this.flags },
      domNormalizer,
      {
        nativeChecked: true,
        field: this.fieldProps,
        onCheckedChange: (next) => {
          // The browser cleared the input's indeterminate flag on the click;
          // the attribute is the element's copy of it and has to follow.
          this.removeAttribute('indeterminate')
          this.changed(next)
        },
      }
    )
    renderChoice(dom, api, api.indicatorProps)
    dom.input.indeterminate = api.indeterminate
  }
}

export class GgSwitchElement extends ChoiceElement {
  protected render(): void {
    const dom = this.dom
    if (!dom) return
    const api = connectSwitch(
      { checked: dom.input.checked, ...this.flags },
      domNormalizer,
      { nativeChecked: true, field: this.fieldProps, onCheckedChange: (next) => this.changed(next) }
    )
    renderChoice(dom, api, api.thumbProps)
  }
}

if (!customElements.get('gg-checkbox')) customElements.define('gg-checkbox', GgCheckboxElement)
if (!customElements.get('gg-switch')) customElements.define('gg-switch', GgSwitchElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-checkbox': GgCheckboxElement
    'gg-switch': GgSwitchElement
  }
}
