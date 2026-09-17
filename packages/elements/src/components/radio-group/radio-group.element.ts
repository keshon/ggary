import { connect as connectRadios, type RadioGroupOrientation } from '@ggary/core/radio-group'
import { connect as connectCheckboxes } from '@ggary/core/checkbox-group'
import { domNormalizer, uid, type GroupContext } from '@ggary/core'
import { h, spread } from '../../spread'
import { buildChoice, renderChoice, type ChoiceDom } from '../checkbox/choice'

interface Option {
  dom: ChoiceDom
  item: { value: string; label: string; disabled: boolean }
}

/** What a <gg-fieldset> pushes into an option group inside it. */
export interface GroupConsumer {
  applyGroup(group: GroupContext | null): void
}

/**
 * The shared enhancement of native options — radios or checkboxes — under a
 * group label and a list, the elements' side of utils/choice-group.
 *
 * They work without JS, so the element enhances rather than renders. Keyboard,
 * tab stops and form values stay native. `name` on the host is given to every
 * option; otherwise the markup's name is kept, and without either the group's
 * id is used.
 */
abstract class ChoiceGroupElement extends HTMLElement implements GroupConsumer {
  static observedAttributes = ['label', 'name', 'orientation', 'disabled', 'required', 'invalid', 'required-message']

  protected abstract readonly inputType: 'radio' | 'checkbox'
  protected options: Option[] = []
  protected id_ = ''
  #label: HTMLSpanElement | null = null
  #list: HTMLDivElement | null = null
  #group: GroupContext | null = null

  connectedCallback(): void {
    if (!this.#list) {
      const inputs = Array.from(this.querySelectorAll<HTMLInputElement>(`input[type="${this.inputType}"]`))
      if (inputs.length === 0) {
        console.warn(`<${this.localName}> expects <input type="${this.inputType}"> options inside it.`, this)
        return
      }
      this.id_ = this.id || uid(`gg-${this.inputType}s`)
      this.#label = h('span')
      this.#list = h('div')

      this.options = inputs.map((input) => {
        // Each option is built inside its own wrapper, so a label-less input
        // does not sweep its neighbours into its new <label>.
        const slot = document.createElement('span')
        const existing = input.closest('label')
        const anchor = existing && this.contains(existing) ? existing : input
        anchor.before(slot)
        slot.append(anchor)
        const dom = buildChoice(slot, input)
        slot.replaceWith(dom.root)
        return {
          dom,
          item: { value: input.value, label: dom.label?.textContent ?? input.value, disabled: input.disabled },
        }
      })
      this.#list.append(...this.options.map((option) => option.dom.root))
      this.replaceChildren(this.#label, this.#list)
    }
    const fieldset = this.closest('gg-fieldset')
    // As a checkbox does inside a field: ask the fieldset to push its state now that the parts exist.
    if (fieldset && 'refresh' in fieldset) fieldset.refresh()
    this.render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render()
  }

  applyGroup(group: GroupContext | null): void {
    this.#group = group
    if (this.isConnected) this.render()
  }

  protected get frame() {
    return {
      id: this.id_,
      items: this.options.map((option) => option.item),
      name: this.getAttribute('name') ?? this.options[0]?.dom.input.getAttribute('name') ?? undefined,
      label: this.getAttribute('label') ?? undefined,
      orientation: (this.getAttribute('orientation') as RadioGroupOrientation) ?? undefined,
      disabled: this.hasAttribute('disabled'),
      required: this.hasAttribute('required'),
      invalid: this.hasAttribute('invalid'),
    }
  }

  protected get group(): GroupContext | undefined {
    return this.#group ?? undefined
  }

  protected paint(api: {
    rootProps: ReturnType<typeof domNormalizer>
    labelProps: ReturnType<typeof domNormalizer>
    listProps: ReturnType<typeof domNormalizer>
    getItemProps: (item: Option['item'], index: number) => Parameters<typeof renderChoice>[1] & {
      indicatorProps: ReturnType<typeof domNormalizer>
    }
  }): void {
    const label = this.getAttribute('label')
    spread(this, api.rootProps)
    spread(this.#label!, api.labelProps)
    this.#label!.textContent = label ?? ''
    this.#label!.hidden = !label
    spread(this.#list!, api.listProps)
    this.options.forEach((option, index) => {
      const parts = api.getItemProps(option.item, index)
      renderChoice(option.dom, parts, parts.indicatorProps)
    })
  }

  protected abstract render(): void
}

/**
 *   <gg-radio-group label="Plan" name="plan">
 *     <label><input type="radio" value="free" checked> Free</label>
 *     <label><input type="radio" value="pro"> Pro</label>
 *   </gg-radio-group>
 *
 * Property: value. Event: valuechange { value }.
 */
export class GgRadioGroupElement extends ChoiceGroupElement {
  protected readonly inputType = 'radio'

  get value(): string | null {
    return this.options.find((option) => option.dom.input.checked)?.item.value ?? null
  }
  set value(next: string | null) {
    for (const option of this.options) option.dom.input.checked = option.item.value === next
    this.render()
  }

  protected render(): void {
    if (this.options.length === 0) return
    const api = connectRadios({ ...this.frame, value: this.value }, domNormalizer, {
      nativeChecked: true,
      group: this.group,
      onValueChange: (value) => {
        this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
        this.render()
      },
    })
    this.paint(api)
  }
}

/**
 *   <gg-checkbox-group label="Show" name="show" required>
 *     <label><input type="checkbox" value="open" checked> Open issues</label>
 *     <label><input type="checkbox" value="mine"> Assigned to me</label>
 *   </gg-checkbox-group>
 *
 * `required` means at least one. Property: value (string[]). Event: valuechange { value }.
 */
export class GgCheckboxGroupElement extends ChoiceGroupElement {
  protected readonly inputType = 'checkbox'

  get value(): string[] {
    return this.options.filter((option) => option.dom.input.checked).map((option) => option.item.value)
  }
  set value(next: string[]) {
    for (const option of this.options) option.dom.input.checked = next.includes(option.item.value)
    this.render()
  }

  protected render(): void {
    if (this.options.length === 0) return
    const api = connectCheckboxes(
      { ...this.frame, value: this.value, requiredMessage: this.getAttribute('required-message') ?? undefined },
      domNormalizer,
      {
        nativeChecked: true,
        group: this.group,
        onValueChange: (value) => {
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
          this.render()
        },
      }
    )
    this.paint(api)
    this.options[0].dom.input.setCustomValidity(api.validationMessage)
  }
}

if (!customElements.get('gg-radio-group')) customElements.define('gg-radio-group', GgRadioGroupElement)
if (!customElements.get('gg-checkbox-group')) customElements.define('gg-checkbox-group', GgCheckboxGroupElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-radio-group': GgRadioGroupElement
    'gg-checkbox-group': GgCheckboxGroupElement
  }
}
