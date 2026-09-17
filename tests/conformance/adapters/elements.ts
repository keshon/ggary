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
  type TextareaProps,
  type CheckboxProps,
  type SwitchProps,
  type RadioGroupProps,
  type DialogProps,
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

/** A native <textarea> as server markup would render it. */
function nativeTextarea(props: TextareaProps): HTMLTextAreaElement {
  const textarea = document.createElement('textarea')
  setAttr(textarea, 'name', props.name)
  setAttr(textarea, 'placeholder', props.placeholder)
  setAttr(textarea, 'rows', props.rows)
  setAttr(textarea, 'maxlength', props.maxLength)
  setAttr(textarea, 'required', props.required)
  setAttr(textarea, 'disabled', props.disabled)
  setAttr(textarea, 'readonly', props.readOnly)
  if (props.defaultValue !== undefined) textarea.value = props.defaultValue
  if (props.onValueChange) textarea.addEventListener('input', () => props.onValueChange!(textarea.value))
  return textarea
}

/** <gg-textarea>'s own attributes; the rest are native, on the textarea. */
function applyTextareaHost(host: HTMLElement, props: Partial<TextareaProps>) {
  if ('size' in props) setAttr(host, 'size', props.size)
  if ('invalid' in props) setAttr(host, 'invalid', props.invalid)
  if ('resize' in props) setAttr(host, 'resize', props.resize)
  if ('autoResize' in props) setAttr(host, 'autoresize', props.autoResize)
  if ('maxRows' in props) setAttr(host, 'max-rows', props.maxRows)
}

/**
 * <gg-checkbox> or <gg-switch> around server markup: a label wrapping a native
 * checkbox. The native state is the initial one; the host carries what a
 * checkbox has no attribute for.
 */
function choiceHost(tag: 'gg-checkbox' | 'gg-switch', props: CheckboxProps) {
  const host = document.createElement(tag)
  const label = document.createElement('label')
  const input = document.createElement('input')
  input.type = 'checkbox'
  setAttr(input, 'name', props.name)
  setAttr(input, 'value', props.value)
  setAttr(input, 'checked', props.defaultChecked === true)
  label.append(input)
  if (props.label) label.append(` ${props.label}`)
  host.append(label)
  if (tag === 'gg-checkbox') setAttr(host, 'indeterminate', props.defaultChecked === 'indeterminate')
  applyChoiceHost(host, props)
  if (props.onCheckedChange) host.addEventListener('checkedchange', (e) => props.onCheckedChange!((e as CustomEvent).detail.checked))
  return { host, input }
}

function applyChoiceHost(host: HTMLElement, props: Partial<CheckboxProps>) {
  for (const key of ['invalid', 'disabled', 'required'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
  if ('readOnly' in props) setAttr(host, 'readonly', props.readOnly)
}

async function mountChoice(tag: 'gg-checkbox' | 'gg-switch', props: CheckboxProps, target: HTMLElement) {
  const { host } = choiceHost(tag, props)
  target.append(host)
  return track({
    root: host,
    async update(patch) {
      applyChoiceHost(host, patch)
    },
    unmount: async () => host.remove(),
  } satisfies Mounted<CheckboxProps>)
}

function applyRadioHost(host: HTMLElement, props: Partial<RadioGroupProps>) {
  for (const key of ['label', 'name', 'orientation', 'disabled', 'required', 'invalid'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
}

/**
 * <gg-dialog> takes one `persistent` flag where the frameworks take two, so
 * the harness maps "neither closes" to it; specs only switch both off at once.
 */
function applyDialogHost(host: HTMLElement, props: Partial<DialogProps>) {
  if ('open' in props) setAttr(host, 'open', props.open)
  if ('title' in props) setAttr(host, 'heading', props.title)
  if ('description' in props) setAttr(host, 'description', props.description)
  if ('modal' in props) setAttr(host, 'non-modal', props.modal === false)
  if ('role' in props) setAttr(host, 'alert', props.role === 'alertdialog')
  if ('closeOnEscape' in props || 'closeOnOutside' in props) {
    setAttr(host, 'persistent', props.closeOnEscape === false && props.closeOnOutside === false)
  }
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

  async textarea(props, target) {
    const host = document.createElement('gg-textarea')
    const textarea = nativeTextarea(props)
    applyTextareaHost(host, props)
    host.append(textarea)
    target.append(host)
    return track({
      root: host,
      async update(patch) {
        applyTextareaHost(host, patch)
        if ('disabled' in patch) setAttr(textarea, 'disabled', patch.disabled)
        if ('readOnly' in patch) setAttr(textarea, 'readonly', patch.readOnly)
        if ('required' in patch) setAttr(textarea, 'required', patch.required)
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<TextareaProps>)
  },

  checkbox: (props, target) => mountChoice('gg-checkbox', props, target),
  switch: (props, target) => mountChoice('gg-switch', props as CheckboxProps, target),

  async radioGroup(props, target) {
    const host = document.createElement('gg-radio-group')
    for (const item of props.items) {
      const label = document.createElement('label')
      const input = document.createElement('input')
      input.type = 'radio'
      input.value = item.value
      setAttr(input, 'checked', item.value === props.defaultValue)
      setAttr(input, 'disabled', item.disabled)
      label.append(input, ` ${item.label}`)
      host.append(label)
    }
    applyRadioHost(host, props)
    if (props.onValueChange) host.addEventListener('valuechange', (e) => props.onValueChange!((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyRadioHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<RadioGroupProps>)
  },

  async dialog(props, target) {
    const host = document.createElement('gg-dialog')
    if (props.trigger) {
      const trigger = document.createElement('button')
      trigger.textContent = props.trigger
      if (props.triggerIsButton) {
        const wrapper = document.createElement('gg-button')
        wrapper.slot = 'trigger'
        wrapper.append(trigger)
        host.append(wrapper)
      } else {
        trigger.slot = 'trigger'
        host.append(trigger)
      }
    }
    const text = document.createElement('p')
    text.textContent = props.body ?? 'Body'
    const action = document.createElement('button')
    action.type = 'button'
    action.textContent = 'Body action'
    host.append(text, action)
    if (props.footer) {
      const footer = document.createElement('footer')
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = props.footer
      footer.append(button)
      host.append(footer)
    }
    setAttr(host, 'open', props.defaultOpen)
    applyDialogHost(host, props)
    if (props.onOpenChange) {
      host.addEventListener('openchange', (e) => {
        const { open, reason } = (e as CustomEvent).detail
        props.onOpenChange!(open, { reason })
      })
    }
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyDialogHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<DialogProps>)
  },

  async field(props, target) {
    const host = document.createElement('gg-field')
    const apply = (patch: Partial<FieldProps>) => {
      for (const key of ['label', 'hint', 'error', 'invalid', 'required', 'disabled'] as const) {
        if (key in patch) setAttr(host, key, patch[key])
      }
      if ('readOnly' in patch) setAttr(host, 'readonly', patch.readOnly)
    }
    if (props.checkbox || props.switch) {
      const tag = props.checkbox ? 'gg-checkbox' : 'gg-switch'
      host.append(choiceHost(tag, (props.checkbox ?? props.switch) as CheckboxProps).host)
    } else if (props.textarea) {
      // Through a <gg-textarea>, which stands down and hands its attributes to the field.
      const wrapper = document.createElement('gg-textarea')
      applyTextareaHost(wrapper, props.textarea)
      wrapper.append(nativeTextarea(props.textarea))
      host.append(wrapper)
    } else {
      const input = props.input ?? {}
      setAttr(host, 'size', input.size)
      host.append(nativeInput(input))
    }
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
