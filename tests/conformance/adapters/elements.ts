import '../../../packages/elements/src/index'
import type { GgChipGroupElement, GgSelectElement } from '../../../packages/elements/src/index'
import {
  type Adapter,
  type ButtonProps,
  type ChipGroupProps,
  type FieldProps,
  type InputProps,
  type Mounted,
  type SelectProps,
  track,
} from '../harness'

/**
 * Custom elements: props become attributes (scalars) or properties (arrays),
 * callbacks become DOM events. Everything is synchronous, so `act` and `update`
 * need no flushing.
 */

function setAttr(el: Element, name: string, value: unknown) {
  if (value === undefined || value === null || value === false) el.removeAttribute(name)
  else el.setAttribute(name, value === true ? '' : String(value))
}

/** A native <input> as server markup would render it: native attributes only. */
function nativeInput(props: InputProps): HTMLInputElement {
  const input = document.createElement('input')
  setAttr(input, 'type', props.type)
  setAttr(input, 'name', props.name)
  setAttr(input, 'placeholder', props.placeholder)
  setAttr(input, 'required', props.required)
  setAttr(input, 'disabled', props.disabled)
  setAttr(input, 'readonly', props.readOnly)
  if (props.defaultValue !== undefined) input.value = props.defaultValue
  if (props.onValueChange) input.addEventListener('input', () => props.onValueChange!(input.value))
  return input
}

function applyButton(host: HTMLElement, props: Partial<ButtonProps>) {
  for (const key of ['emphasis', 'tone', 'size', 'disabled', 'loading'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
}

export const elements: Adapter = {
  name: 'elements',
  supports: { controlled: false },

  async act(interaction) {
    interaction()
  },

  async button(props, target) {
    const host = document.createElement('gg-button')
    const button = document.createElement('button')
    button.textContent = props.label
    host.append(button)
    applyButton(host, props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyButton(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<ButtonProps>)
  },

  async select(props, target) {
    const el = document.createElement('gg-select') as GgSelectElement
    let current = props
    el.addEventListener('valuechange', (event) => {
      const { value, item } = (event as CustomEvent).detail
      current.onValueChange?.(value, item)
    })
    // Properties before connection: the element reads them in connectedCallback.
    el.items = props.items
    setAttr(el, 'label', props.label)
    setAttr(el, 'placeholder', props.placeholder)
    setAttr(el, 'name', props.name)
    setAttr(el, 'value', props.defaultValue)
    setAttr(el, 'disabled', props.disabled)
    target.append(el)

    return track({
      root: el,
      async update(patch) {
        current = { ...current, ...patch }
        if ('items' in patch) el.items = patch.items!
        if ('disabled' in patch) setAttr(el, 'disabled', patch.disabled)
        if ('label' in patch) setAttr(el, 'label', patch.label)
      },
      // Removal IS unmounting for a custom element: disconnectedCallback tears
      // down its listeners.
      unmount: async () => el.remove(),
    } satisfies Mounted<SelectProps>)
  },

  async input(props, target) {
    const host = document.createElement('gg-input')
    const input = nativeInput(props)
    setAttr(host, 'size', props.size)
    setAttr(host, 'invalid', props.invalid)
    host.append(input)
    target.append(host)
    return track({
      root: host,
      async update(patch) {
        if ('size' in patch) setAttr(host, 'size', patch.size)
        if ('invalid' in patch) setAttr(host, 'invalid', patch.invalid)
        if ('disabled' in patch) setAttr(input, 'disabled', patch.disabled)
        if ('readOnly' in patch) setAttr(input, 'readonly', patch.readOnly)
        if ('required' in patch) setAttr(input, 'required', patch.required)
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<InputProps>)
  },

  async field(props, target) {
    const host = document.createElement('gg-field')
    const apply = (patch: Partial<FieldProps>) => {
      for (const key of ['label', 'hint', 'error', 'invalid', 'required', 'disabled'] as const) {
        if (key in patch) setAttr(host, key, patch[key])
      }
      if ('readOnly' in patch) setAttr(host, 'readonly', patch.readOnly)
    }
    const input = props.input ?? {}
    setAttr(host, 'size', input.size)
    host.append(nativeInput(input))
    apply(props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => apply(patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<FieldProps>)
  },

  async chipGroup(props, target) {
    const el = document.createElement('gg-chip-group') as GgChipGroupElement
    let current = props
    el.addEventListener('selectionchange', (event) => {
      const { selection, items } = (event as CustomEvent).detail
      current.onSelectionChange?.(selection, items)
    })
    el.addEventListener('chipremove', (event) => {
      const { value, item } = (event as CustomEvent).detail
      current.onRemove?.(value, item)
    })
    el.items = props.items
    setAttr(el, 'label', props.label)
    setAttr(el, 'mode', props.mode)
    setAttr(el, 'orientation', props.orientation)
    setAttr(el, 'removable', props.removable)
    setAttr(el, 'disabled', props.disabled)
    setAttr(el, 'name', props.name)
    target.append(el)
    // The element has no default-selection attribute; the property is its
    // equivalent, and like defaultValue it does not report a user intent.
    if (props.defaultValue) el.selection = props.defaultValue

    return track({
      root: el,
      async update(patch) {
        current = { ...current, ...patch }
        if ('items' in patch) el.items = patch.items!
        for (const key of ['disabled', 'mode', 'orientation', 'removable'] as const) {
          if (key in patch) setAttr(el, key, patch[key])
        }
      },
      unmount: async () => el.remove(),
    } satisfies Mounted<ChipGroupProps>)
  },
}
