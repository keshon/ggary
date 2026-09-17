import { connect } from '@ggary/core/file-drop'
import { attachFileDrop, domNormalizer, onFormReset, type Dict } from '@ggary/core'
import { h, spread } from '../../spread'
import type { FieldConsumer } from '../checkbox/choice'

/**
 * Enhancement of a native file input, which the element wraps in the <label>
 * that becomes the zone — a custom element cannot be a label itself:
 *
 *   <gg-file-drop label="Drag files in or choose them" hint="Up to 20 MB, .json and .csv">
 *     <input type="file" name="import" accept=".json,.csv" multiple>
 *   </gg-file-drop>
 *
 * Attributes: label, hint, disabled, required, invalid. Event: fileschange
 * { files }, beside the native input and change. Inside a <gg-field> the field
 * pushes its control props in with applyField().
 */
export class GgFileDropElement extends HTMLElement implements FieldConsumer {
  static observedAttributes = ['label', 'hint', 'disabled', 'required', 'invalid']

  #input: HTMLInputElement | null = null
  #zone: HTMLLabelElement | null = null
  #icon: HTMLSpanElement | null = null
  #text: HTMLSpanElement | null = null
  #files: HTMLSpanElement | null = null
  #hint: HTMLSpanElement | null = null
  #field: Dict | null = null
  #native = { disabled: false, required: false }
  #dragging = false
  #chosen: string[] = []
  #stopDrop: (() => void) | null = null
  #stopReset: (() => void) | null = null

  connectedCallback(): void {
    this.#stopReset?.()
    this.#stopReset = onFormReset(this, () => {
      this.#chosen = []
      this.#render()
    })
    if (!this.#zone) {
      const input = this.querySelector<HTMLInputElement>('input[type="file"]')
      if (!input) {
        console.warn('<gg-file-drop> expects an <input type="file"> inside it.', this)
        return
      }
      this.#input = input
      this.#native = { disabled: input.hasAttribute('disabled'), required: input.hasAttribute('required') }
      this.#icon = h('span')
      this.#text = h('span')
      this.#files = h('span')
      this.#hint = h('span')
      this.#zone = h('label', undefined, [this.#icon, input, this.#text])
      this.replaceChildren(this.#zone)
    }
    this.#stopDrop?.()
    this.#stopDrop = attachFileDrop(this.#zone!, () => this.#input, {
      onDraggingChange: (dragging) => {
        this.#dragging = dragging
        this.#render()
      },
    })
    const field = this.closest('gg-field')
    if (field && 'refresh' in field) field.refresh()
    this.#render()
  }

  disconnectedCallback(): void {
    this.#stopDrop?.()
    this.#stopDrop = null
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

  /** What was chosen, as the native input holds it. */
  get files(): File[] {
    return [...(this.#input?.files ?? [])]
  }

  #render(): void {
    const zone = this.#zone
    const input = this.#input
    if (!zone || !input) return
    const api = connect(
      {
        name: input.getAttribute('name') ?? undefined,
        accept: input.getAttribute('accept') ?? undefined,
        multiple: input.hasAttribute('multiple'),
        label: this.getAttribute('label') ?? undefined,
        hint: this.getAttribute('hint') ?? undefined,
        disabled: this.hasAttribute('disabled') || this.#native.disabled,
        required: this.hasAttribute('required') || this.#native.required,
        invalid: this.hasAttribute('invalid'),
        files: this.#chosen,
      },
      domNormalizer,
      {
        dragging: this.#dragging,
        field: this.#field ?? undefined,
        onFilesChange: (files) => {
          this.#chosen = files.map((file) => file.name)
          this.dispatchEvent(new CustomEvent('fileschange', { detail: { files }, bubbles: true }))
          this.#render()
        },
      }
    )
    spread(zone, api.rootProps)
    spread(this.#icon!, api.iconProps)
    spread(input, api.inputProps)
    spread(this.#text!, api.textProps)
    this.#text!.textContent = api.label
    spread(this.#files!, api.filesProps)
    this.#files!.textContent = api.filesText
    spread(this.#hint!, api.hintProps)
    this.#hint!.textContent = api.hint ?? ''

    const parts: Element[] = [this.#icon!, input, this.#text!]
    if (api.showFiles) parts.push(this.#files!)
    if (api.showHint) parts.push(this.#hint!)
    const current = [...zone.children]
    if (current.length !== parts.length || parts.some((part, i) => current[i] !== part)) zone.replaceChildren(...parts)
  }
}

if (!customElements.get('gg-file-drop')) customElements.define('gg-file-drop', GgFileDropElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-file-drop': GgFileDropElement
  }
}
