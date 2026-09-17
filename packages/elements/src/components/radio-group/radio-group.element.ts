import { connect, type RadioGroupOrientation, type RadioItem } from '@ggary/core/radio-group'
import { domNormalizer, uid } from '@ggary/core'
import { h, spread } from '../../spread'
import { buildChoice, renderChoice, type ChoiceDom } from '../checkbox/choice'

/**
 * Light-DOM enhancement of native radios — they work without JS, so the
 * element enhances rather than renders:
 *
 *   <gg-radio-group label="Plan" name="plan">
 *     <label><input type="radio" value="free" checked> Free</label>
 *     <label><input type="radio" value="pro"> Pro</label>
 *   </gg-radio-group>
 *
 * The host is the radiogroup. Keyboard, the single tab stop and form value stay
 * native. `name` on the host is given to every radio; otherwise the markup's
 * name is kept, and without either the group's id is used.
 */
export class GgRadioGroupElement extends HTMLElement {
  static observedAttributes = ['label', 'name', 'orientation', 'disabled', 'required', 'invalid']

  #id = ''
  #options: { dom: ChoiceDom; item: RadioItem }[] = []
  #label: HTMLSpanElement | null = null
  #list: HTMLDivElement | null = null

  get value(): string | null {
    return this.#options.find((option) => option.dom.input.checked)?.item.value ?? null
  }
  set value(next: string | null) {
    for (const option of this.#options) option.dom.input.checked = option.item.value === next
    this.#render()
  }

  connectedCallback(): void {
    if (!this.#list) {
      const inputs = Array.from(this.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
      if (inputs.length === 0) {
        console.warn('<gg-radio-group> expects <input type="radio"> options inside it.', this)
        return
      }
      this.#id = this.id || uid('gg-radio')
      this.#label = h('span')
      this.#list = h('div')

      this.#options = inputs.map((input) => {
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
      this.#list.append(...this.#options.map((option) => option.dom.root))
      this.replaceChildren(this.#label, this.#list)
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (!this.#list) return
    const label = this.getAttribute('label') ?? undefined
    const api = connect(
      {
        id: this.#id,
        items: this.#options.map((option) => option.item),
        name: this.getAttribute('name') ?? this.#options[0]?.dom.input.getAttribute('name') ?? undefined,
        value: this.value,
        label,
        orientation: (this.getAttribute('orientation') as RadioGroupOrientation) ?? undefined,
        disabled: this.hasAttribute('disabled'),
        required: this.hasAttribute('required'),
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer,
      {
        nativeChecked: true,
        onValueChange: (value) => {
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
          this.#render()
        },
      }
    )

    spread(this, api.rootProps)
    spread(this.#label!, api.labelProps)
    this.#label!.textContent = label ?? ''
    this.#label!.hidden = !label
    spread(this.#list, api.listProps)
    this.#options.forEach((option, index) => {
      const parts = api.getItemProps(option.item, index)
      renderChoice(option.dom, parts, parts.indicatorProps)
    })
  }
}

if (!customElements.get('gg-radio-group')) customElements.define('gg-radio-group', GgRadioGroupElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-radio-group': GgRadioGroupElement
  }
}
