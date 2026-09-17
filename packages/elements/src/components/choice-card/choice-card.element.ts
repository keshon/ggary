import { connect, type ChoiceCardType } from '@ggary/core/choice-card'
import { domNormalizer, onFormReset, uid, type GroupContext } from '@ggary/core'
import { h, spread } from '../../spread'
import type { GroupConsumer } from '../radio-group/radio-group.element'

interface Card {
  root: HTMLLabelElement
  input: HTMLInputElement
  control: HTMLSpanElement
  indicator: HTMLSpanElement
  body: HTMLSpanElement
  title: HTMLSpanElement
  description: HTMLSpanElement | null
  item: { value: string; title: string; description?: string; disabled: boolean }
}

/**
 * Enhancement of native radios or checkboxes, one card each:
 *
 *   <gg-choice-cards label="Run mode" name="mode">
 *     <label>
 *       <input type="radio" value="parallel" checked>
 *       In parallel
 *       <span slot="description">Up to 12 agents at once. More tokens, no guaranteed order.</span>
 *     </label>
 *   </gg-choice-cards>
 *
 * What carries `slot="description"` is the explanation; everything else in the
 * label is the heading. Attributes: label, name, type (radio · checkbox),
 * orientation, disabled, required, invalid. Property: value. Event: valuechange.
 */
export class GgChoiceCardsElement extends HTMLElement implements GroupConsumer {
  static observedAttributes = ['label', 'name', 'type', 'orientation', 'disabled', 'required', 'invalid']

  #cards: Card[] = []
  #id = ''
  #label: HTMLSpanElement | null = null
  #list: HTMLDivElement | null = null
  #group: GroupContext | null = null
  #stopReset: (() => void) | null = null

  get #type(): ChoiceCardType {
    return this.getAttribute('type') === 'checkbox' ? 'checkbox' : 'radio'
  }

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#render())
    if (!this.#list) {
      const inputs = [...this.querySelectorAll<HTMLInputElement>('input[type="radio"], input[type="checkbox"]')]
      if (inputs.length === 0) {
        console.warn('<gg-choice-cards> expects <input type="radio"> or <input type="checkbox"> options inside it.', this)
        return
      }
      this.#id = this.id || uid('gg-choice-cards')
      this.#label = h('span')
      this.#list = h('div')
      this.#cards = inputs.map((input) => {
        const existing = input.closest('label')
        const root = existing && this.contains(existing) ? existing : document.createElement('label')
        if (root !== existing) input.before(root)
        const description = root.querySelector<HTMLElement>('[slot="description"]')
        const rest = [...root.childNodes].filter((node) => node !== input && node !== description)
        const title = h('span')
        title.append(...rest)
        if (title.firstChild?.nodeType === Node.TEXT_NODE) {
          title.firstChild.textContent = title.firstChild.textContent!.trim()
        }
        const indicator = h('span')
        const control = h('span', undefined, [input, indicator])
        const body = h('span', undefined, description ? [title, description] : [title])
        root.replaceChildren(control, body)
        return {
          root, input, control, indicator, body, title,
          description: (description as HTMLSpanElement) ?? null,
          item: {
            value: input.value,
            title: title.textContent ?? input.value,
            description: description?.textContent ?? undefined,
            disabled: input.hasAttribute('disabled'),
          },
        }
      })
      this.#list.append(...this.#cards.map((card) => card.root))
      this.replaceChildren(this.#label, this.#list)
    }
    const fieldset = this.closest('gg-fieldset')
    if (fieldset && 'refresh' in fieldset) fieldset.refresh()
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  applyGroup(group: GroupContext | null): void {
    this.#group = group
    if (this.isConnected) this.#render()
  }

  get value(): string | string[] | null {
    const checked = this.#cards.filter((card) => card.input.checked).map((card) => card.item.value)
    return this.#type === 'checkbox' ? checked : (checked[0] ?? null)
  }
  set value(next: string | string[] | null) {
    const wanted = ([] as string[]).concat((next ?? []) as string | string[])
    for (const card of this.#cards) card.input.checked = wanted.includes(card.item.value)
    this.#render()
  }

  #render(): void {
    if (this.#cards.length === 0) return
    const label = this.getAttribute('label')
    const api = connect(
      {
        id: this.#id,
        items: this.#cards.map((card) => card.item),
        type: this.#type,
        name: this.getAttribute('name') ?? this.#cards[0].input.getAttribute('name') ?? undefined,
        value: this.value,
        label: label ?? undefined,
        orientation: (this.getAttribute('orientation') as 'vertical' | 'horizontal') ?? undefined,
        disabled: this.hasAttribute('disabled'),
        required: this.hasAttribute('required'),
        invalid: this.hasAttribute('invalid'),
      },
      domNormalizer,
      {
        nativeChecked: true,
        group: this.#group ?? undefined,
        onValueChange: (value) => {
          this.dispatchEvent(new CustomEvent('valuechange', { detail: { value }, bubbles: true }))
          this.#render()
        },
      }
    )
    spread(this, api.rootProps, 'choice-cards')
    spread(this.#label!, api.labelProps)
    this.#label!.textContent = label ?? ''
    this.#label!.hidden = label === null
    spread(this.#list!, api.listProps)
    this.#cards.forEach((card, index) => {
      const parts = api.getItemProps(card.item, index)
      spread(card.root, parts.rootProps)
      spread(card.control, parts.controlProps)
      spread(card.input, parts.inputProps)
      spread(card.indicator, parts.indicatorProps)
      spread(card.body, parts.bodyProps)
      spread(card.title, parts.titleProps)
      if (card.description) spread(card.description, parts.descriptionProps)
    })
  }
}

if (!customElements.get('gg-choice-cards')) customElements.define('gg-choice-cards', GgChoiceCardsElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-choice-cards': GgChoiceCardsElement
  }
}
