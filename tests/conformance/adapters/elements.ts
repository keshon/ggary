import '../../../packages/elements/src/index'
import type { GgChipGroupElement, GgSelectElement } from '../../../packages/elements/src/index'
import { type Adapter, type ButtonProps, type ChipGroupProps, type Mounted, type SelectProps, track } from '../harness'

/**
 * Custom elements: props become attributes (scalars) or properties (arrays),
 * callbacks become DOM events. Everything is synchronous, so `act` and `update`
 * need no flushing.
 */

function setAttr(el: Element, name: string, value: unknown) {
  if (value === undefined || value === null || value === false) el.removeAttribute(name)
  else el.setAttribute(name, value === true ? '' : String(value))
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
