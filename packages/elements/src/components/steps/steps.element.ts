import { connect, type StepState } from '@ggary/core/steps'
import { domNormalizer } from '@ggary/core'
import { h, spread } from '../../spread'

/**
 *   <gg-steps label="Import">
 *     <li data-state="done">Source</li>
 *     <li data-state="current">Check<span slot="note">checking</span></li>
 *     <li data-state="todo">Launch</li>
 *   </gg-steps>
 *
 * The host becomes the ordered list (role="list" with listitem children), so
 * the steps keep their number and their total. Every step declares its state;
 * the word beside the name is the state's own unless the markup gives one.
 */
export class GgStepsElement extends HTMLElement {
  static observedAttributes = ['label']

  #steps: { item: HTMLElement; name: HTMLSpanElement; note: HTMLSpanElement; data: { name: string; note?: string; state: StepState } }[] = []

  connectedCallback(): void {
    if (this.#steps.length === 0) {
      const items = [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement)
      if (items.length === 0) {
        console.warn('<gg-steps> expects one element per step inside it.', this)
        return
      }
      this.#steps = items.map((item) => {
        const given = item.querySelector<HTMLElement>('[slot="note"]')
        const name = h('span')
        name.append(...[...item.childNodes].filter((node) => node !== given))
        if (name.firstChild?.nodeType === Node.TEXT_NODE) {
          name.firstChild.textContent = name.firstChild.textContent!.trim()
        }
        const note = given ?? h('span')
        item.replaceChildren(name, note)
        return {
          item,
          name,
          note,
          data: {
            name: name.textContent ?? '',
            note: given?.textContent ?? undefined,
            state: (item.dataset.state as StepState) ?? 'todo',
          },
        }
      })
    }
    this.#render()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    if (this.#steps.length === 0) return
    const api = connect(
      { items: this.#steps.map((step) => step.data), label: this.getAttribute('label') ?? undefined },
      domNormalizer
    )
    spread(this, { attrs: { ...api.rootProps.attrs, role: 'list' }, listeners: api.rootProps.listeners }, 'steps')
    this.#steps.forEach((step) => {
      const parts = api.getItemProps(step.data)
      spread(step.item, { attrs: { ...parts.itemProps.attrs, role: 'listitem' }, listeners: parts.itemProps.listeners })
      spread(step.name, parts.nameProps)
      spread(step.note, parts.noteProps)
      if (step.note.textContent !== parts.note) step.note.textContent = parts.note
    })
  }
}

if (!customElements.get('gg-steps')) customElements.define('gg-steps', GgStepsElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-steps': GgStepsElement
  }
}
