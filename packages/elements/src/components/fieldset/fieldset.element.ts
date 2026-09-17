import { connect, createFieldsetMachine, type FieldsetEvent, type FieldsetState } from '@ggary/core/fieldset'
import { onFormReset, domNormalizer, uid, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'
import type { GroupConsumer } from '../radio-group/radio-group.element'

/**
 * A native <fieldset> built around the author's content:
 *
 *   <gg-fieldset legend="Plan" error="Choose a plan" required>
 *     <gg-radio-group name="plan">…</gg-radio-group>
 *   </gg-fieldset>
 *
 * The children become the content; a legend goes before them and the hint or
 * error after. An option group inside receives the fieldset's state, pushed as
 * <gg-field> pushes into a checkbox. `disabled` is the native attribute, so the
 * browser disables every control inside.
 *
 * Attributes: legend, hint, error, invalid, required, disabled. Method: refresh().
 */
export class GgFieldsetElement extends HTMLElement {
  static observedAttributes = ['legend', 'hint', 'error', 'invalid', 'required', 'disabled']

  #machine: Machine<FieldsetState, FieldsetEvent> | null = null
  #unsubscribe: (() => void) | null = null
  #fieldset: HTMLFieldSetElement | null = null
  #legend: HTMLLegendElement | null = null
  #content: HTMLDivElement | null = null
  #hint: HTMLDivElement | null = null
  #error: HTMLDivElement | null = null

  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => this.#machine?.send({ type: 'RESET' }))
    if (!this.#machine) {
      this.#fieldset = h('fieldset')
      this.#legend = h('legend')
      this.#content = h('div')
      this.#hint = h('div')
      this.#error = h('div')
      this.#content.append(...Array.from(this.childNodes))
      this.#fieldset.append(this.#legend, this.#content, this.#hint, this.#error)
      this.append(this.#fieldset)
      this.#machine = createFieldsetMachine({ id: this.id ? `${this.id}-fieldset` : uid('gg-fieldset'), ...this.#flags() })
    }
    this.#unsubscribe = this.#machine.subscribe(() => this.#render())
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = null
    this.#unsubscribe?.()
    this.#unsubscribe = null
  }

  attributeChangedCallback(name: string): void {
    if (!this.#machine) return
    if (['invalid', 'required', 'disabled'].includes(name)) this.#machine.send({ type: 'SYNC', ...this.#flags() })
    this.refresh()
  }

  /** Render again, and push the current state into the option groups inside. */
  refresh(): void {
    if (this.isConnected) this.#render()
  }

  #flags() {
    return {
      invalid: this.hasAttribute('invalid'),
      required: this.hasAttribute('required'),
      disabled: this.hasAttribute('disabled'),
    }
  }

  #render(): void {
    const machine = this.#machine
    if (!machine || !this.#fieldset) return

    const legend = this.getAttribute('legend')
    const hint = this.getAttribute('hint')
    const api = connect(machine.getState(), machine.send, domNormalizer, {
      legend: legend !== null,
      hint: hint !== null,
      error: this.getAttribute('error') ?? undefined,
    })

    spread(this.#fieldset, api.rootProps)
    spread(this.#legend!, api.legendProps)
    this.#legend!.textContent = legend ?? ''
    this.#legend!.hidden = legend === null
    spread(this.#content!, api.contentProps)
    spread(this.#hint!, api.hintProps)
    this.#hint!.textContent = hint ?? ''
    if (hint === null) this.#hint!.hidden = true
    spread(this.#error!, api.errorProps)
    this.#error!.textContent = api.errorText

    for (const group of this.#content!.querySelectorAll('gg-radio-group, gg-checkbox-group')) {
      // Only groups not already inside a nearer fieldset.
      if (group.closest('gg-fieldset') !== this) continue
      if ('applyGroup' in group) (group as unknown as GroupConsumer).applyGroup(api.group)
    }
  }
}

if (!customElements.get('gg-fieldset')) customElements.define('gg-fieldset', GgFieldsetElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-fieldset': GgFieldsetElement
  }
}
