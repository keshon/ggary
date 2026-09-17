import '../../../packages/elements/src/index'
import type { GgAvatarGroupElement, GgChoiceCardsElement, GgNumberFieldElement, GgSliderElement, GgChipGroupElement, GgMenuElement, GgMenubarElement, GgSelectElement, GgTabsElement, GgToasterElement } from '../../../packages/elements/src/index'
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
  type BreadcrumbsProps,
  type ButtonGroupProps,
  type ChoiceCardGroupProps,
  type NavProps,
  type PaginationProps,
  type StepsProps,
  type ToolbarProps,
  type FileDropProps,
  type InputGroupProps,
  type SearchProps,
  type SegmentedControlProps,
  type SliderProps,
  type NumberFieldProps,
  type DialogProps,
  type CheckboxGroupProps,
  type FieldsetProps,
  type PopoverProps,
  type TooltipProps,
  type MenuProps,
  type MenubarProps,
  type TabsProps,
  type ToasterProps,
  type BadgeProps,
  type AvatarProps,
  type AvatarGroupProps,
  type SpinnerProps,
  type SkeletonProps,
  type CardProps,
  type PanelProps,
  type BannerProps,
  type NoteProps,
  type EmptyStateProps,
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

/** <gg-segmented-control> around native radios, as server markup renders them. */
function segmentedHost(props: SegmentedControlProps): HTMLElement {
  const host = document.createElement('gg-segmented-control')
  for (const item of props.items) {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'radio'
    input.value = item.value
    setAttr(input, 'checked', item.value === props.defaultValue)
    setAttr(input, 'disabled', item.disabled)
    label.append(input, item.label)
    host.append(label)
  }
  return host
}

function applySegmentedHost(host: HTMLElement, props: Partial<SegmentedControlProps>) {
  for (const key of ['label', 'name', 'size', 'disabled', 'required'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
  if ('fullWidth' in props) setAttr(host, 'full-width', props.fullWidth)
}

/** <gg-slider> around a native range input. */
function sliderHost(props: SliderProps): HTMLElement {
  const host = document.createElement('gg-slider')
  const input = document.createElement('input')
  input.type = 'range'
  setAttr(input, 'min', props.min)
  setAttr(input, 'max', props.max)
  setAttr(input, 'step', props.step)
  setAttr(input, 'name', props.name)
  const start = props.value ?? props.defaultValue
  if (start !== undefined) input.value = String(start)
  host.append(input)
  return host
}

function applySliderHost(host: HTMLElement, props: Partial<SliderProps>) {
  for (const key of ['label', 'size', 'disabled', 'required', 'invalid'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
  if ('showValue' in props) setAttr(host, 'show-value', props.showValue)
  if ('valueText' in props) setAttr(host, 'value-text', props.valueText)
  if (props.value !== undefined) (host as GgSliderElement).value = props.value
}

/** <gg-number-field> around a native number input. */
function numberHost(props: NumberFieldProps): HTMLElement {
  const host = document.createElement('gg-number-field')
  const input = document.createElement('input')
  input.type = 'number'
  setAttr(input, 'min', props.min)
  setAttr(input, 'max', props.max)
  setAttr(input, 'step', props.step)
  setAttr(input, 'name', props.name)
  setAttr(input, 'placeholder', props.placeholder)
  const start = props.value === undefined ? props.defaultValue : props.value
  if (start !== undefined && start !== null) input.value = String(start)
  host.append(input)
  return host
}

function applyNumberHost(host: HTMLElement, props: Partial<NumberFieldProps>) {
  for (const key of ['axis', 'label', 'size', 'disabled', 'required', 'invalid'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
  if ('readOnly' in props) setAttr(host, 'readonly', props.readOnly)
  if (props.value !== undefined) (host as GgNumberFieldElement).value = props.value
}

/** <gg-choice-cards> around native radios or checkboxes, as server markup renders them. */
function choiceCardsHost(props: ChoiceCardGroupProps): HTMLElement {
  const host = document.createElement('gg-choice-cards')
  const checked = ([] as string[]).concat((props.defaultValue ?? []) as string | string[])
  for (const item of props.items) {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = props.type ?? 'radio'
    input.value = item.value
    setAttr(input, 'checked', checked.includes(item.value))
    setAttr(input, 'disabled', item.disabled)
    label.append(input, item.title)
    if (item.description) {
      const description = document.createElement('span')
      description.slot = 'description'
      description.textContent = item.description
      label.append(description)
    }
    host.append(label)
  }
  return host
}

function applyChoiceCardsHost(host: HTMLElement, props: Partial<ChoiceCardGroupProps>) {
  for (const key of ['label', 'name', 'type', 'orientation', 'disabled', 'required', 'invalid'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
  if (props.value !== undefined) (host as GgChoiceCardsElement).value = props.value
}

/** <gg-search> around a native search input. */
function searchHost(props: SearchProps): HTMLElement {
  const host = document.createElement('gg-search')
  const input = document.createElement('input')
  input.type = 'search'
  setAttr(input, 'name', props.name)
  setAttr(input, 'placeholder', props.placeholder)
  if (props.defaultValue !== undefined) input.value = props.defaultValue
  if (props.value !== undefined) input.value = props.value
  if (props.onValueChange) input.addEventListener('input', () => props.onValueChange!(input.value))
  host.append(input)
  return host
}

function applySearchHost(host: HTMLElement, props: Partial<SearchProps>) {
  for (const key of ['label', 'size', 'disabled', 'required', 'invalid'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
  if ('readOnly' in props) setAttr(host, 'readonly', props.readOnly)
  if (props.value !== undefined) host.querySelector('input')!.value = props.value
}

/** <gg-file-drop> around a native file input. */
function fileDropHost(props: FileDropProps): HTMLElement {
  const host = document.createElement('gg-file-drop')
  const input = document.createElement('input')
  input.type = 'file'
  setAttr(input, 'name', props.name)
  setAttr(input, 'accept', props.accept)
  setAttr(input, 'multiple', props.multiple)
  host.append(input)
  return host
}

function applyFileDropHost(host: HTMLElement, props: Partial<FileDropProps>) {
  for (const key of ['label', 'hint', 'disabled', 'required', 'invalid'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
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

function applyPopoverHost(host: HTMLElement, props: Partial<PopoverProps>) {
  if ('open' in props) setAttr(host, 'open', props.open)
  if ('title' in props) setAttr(host, 'heading', props.title)
  if ('placement' in props) setAttr(host, 'placement', props.placement)
  if ('closeButton' in props) setAttr(host, 'close-button', props.closeButton)
  if ('closeOnEscape' in props || 'closeOnOutside' in props) {
    setAttr(host, 'persistent', props.closeOnEscape === false && props.closeOnOutside === false)
  }
}

function applyMenuHost(host: GgMenuElement, props: Partial<MenuProps>) {
  if ('items' in props) host.items = props.items!
  if ('open' in props) setAttr(host, 'open', props.open)
  if ('placement' in props) setAttr(host, 'placement', props.placement)
  if ('label' in props) setAttr(host, 'label', props.label)
  if ('closeOnSelect' in props) setAttr(host, 'keep-open', props.closeOnSelect === false)
}

function applyTooltipHost(host: HTMLElement, props: Partial<TooltipProps>) {
  if ('content' in props) setAttr(host, 'content', props.content)
  if ('openDelay' in props) setAttr(host, 'open-delay', props.openDelay)
  if ('closeDelay' in props) setAttr(host, 'close-delay', props.closeDelay)
  if ('disabled' in props) setAttr(host, 'disabled', props.disabled)
}

/** <gg-radio-group> or <gg-checkbox-group> around native options, as a server renders them. */
function optionsHost(
  tag: 'gg-radio-group' | 'gg-checkbox-group',
  items: { value: string; label: string; disabled?: boolean }[],
  checked: string[]
) {
  const host = document.createElement(tag)
  for (const item of items) {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = tag === 'gg-radio-group' ? 'radio' : 'checkbox'
    input.value = item.value
    setAttr(input, 'checked', checked.includes(item.value))
    setAttr(input, 'disabled', item.disabled)
    label.append(input, ` ${item.label}`)
    host.append(label)
  }
  return host
}

function applyFieldsetHost(host: HTMLElement, props: Partial<FieldsetProps>) {
  for (const key of ['legend', 'hint', 'error', 'invalid', 'required', 'disabled'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
}

function applyButton(host: HTMLElement, props: Partial<ButtonProps>) {
  for (const key of ['emphasis', 'tone', 'size', 'disabled', 'loading'] as const) {
    if (key in props) setAttr(host, key, props[key])
  }
}

export const elements: Adapter = {
  name: 'elements',
  supports: { controlled: false, refusal: false, linkRoot: false },

  async act(interaction) {
    interaction()
  },

  async wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms))
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

  async segmentedControl(props, target) {
    const host = segmentedHost(props)
    applySegmentedHost(host, props)
    if (props.onValueChange) host.addEventListener('valuechange', (e) => props.onValueChange!((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applySegmentedHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<SegmentedControlProps>)
  },

  async slider(props, target) {
    const host = sliderHost(props)
    applySliderHost(host, props)
    if (props.onValueChange) host.addEventListener('valuechange', (e) => props.onValueChange!((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applySliderHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<SliderProps>)
  },

  async numberField(props, target) {
    const host = numberHost(props)
    applyNumberHost(host, props)
    if (props.onValueChange) host.addEventListener('valuechange', (e) => props.onValueChange!((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyNumberHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<NumberFieldProps>)
  },

  async choiceCards(props, target) {
    const host = choiceCardsHost(props)
    applyChoiceCardsHost(host, props)
    if (props.onValueChange) host.addEventListener('valuechange', (e) => props.onValueChange!((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyChoiceCardsHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<ChoiceCardGroupProps>)
  },

  async search(props, target) {
    const host = searchHost(props)
    applySearchHost(host, props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applySearchHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<SearchProps>)
  },

  async inputGroup(props, target) {
    const host = document.createElement('gg-input-group')
    host.append(nativeInput(props.input ?? {}))
    const apply = (patch: Partial<InputGroupProps>) => {
      for (const key of ['prefix', 'suffix', 'size', 'disabled', 'invalid'] as const) {
        if (key in patch) setAttr(host, key, patch[key])
      }
    }
    apply(props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => apply(patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<InputGroupProps>)
  },

  async fileDrop(props, target) {
    const host = fileDropHost(props)
    applyFileDropHost(host, props)
    if (props.onFilesChange) host.addEventListener('fileschange', (e) => props.onFilesChange!((e as CustomEvent).detail.files))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyFileDropHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<FileDropProps>)
  },

  async buttonGroup(props, target) {
    const host = document.createElement('gg-button-group')
    for (const label of props.buttons ?? ['One', 'Two', 'Three']) {
      const wrapper = document.createElement('gg-button')
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      if (props.size) wrapper.setAttribute('size', props.size)
      wrapper.append(button)
      host.append(wrapper)
    }
    const apply = (patch: Partial<ButtonGroupProps>) => {
      if ('size' in patch) setAttr(host, 'size', patch.size)
      if ('label' in patch) setAttr(host, 'label', patch.label)
    }
    apply(props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => apply(patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<ButtonGroupProps>)
  },

  async breadcrumbs(props, target) {
    const host = document.createElement('gg-breadcrumbs')
    for (const item of props.items) {
      const crumb = document.createElement(item.href ? 'a' : 'span')
      if (item.href) crumb.setAttribute('href', item.href)
      crumb.textContent = item.label
      host.append(crumb)
    }
    setAttr(host, 'label', props.label)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => setAttr(host, 'label', patch.label),
      unmount: async () => host.remove(),
    } satisfies Mounted<BreadcrumbsProps>)
  },

  async nav(props, target) {
    const host = document.createElement('gg-nav')
    for (const group of props.groups) {
      const container = document.createElement('div')
      if (group.label !== undefined) container.dataset.group = group.label
      for (const item of group.items) {
        const anchor = document.createElement('a')
        anchor.href = item.href
        anchor.textContent = item.label
        if (item.icon) anchor.dataset.icon = item.icon
        if (item.current) anchor.setAttribute('aria-current', 'page')
        if (item.count !== undefined) {
          const count = document.createElement('span')
          count.dataset.count = ''
          count.textContent = String(item.count)
          anchor.append(count)
        }
        container.append(anchor)
      }
      host.append(container)
    }
    setAttr(host, 'label', props.label)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => setAttr(host, 'label', patch.label),
      unmount: async () => host.remove(),
    } satisfies Mounted<NavProps>)
  },

  async pagination(props, target) {
    const host = document.createElement('gg-pagination')
    for (const item of props.items) {
      const link = document.createElement(item.gap ? 'span' : 'a')
      link.textContent = item.label
      if (item.href) link.setAttribute('href', item.href)
      if (item.page !== undefined) (link as HTMLElement).dataset.page = String(item.page)
      if (item.current) link.setAttribute('aria-current', 'page')
      if (item.disabled) link.setAttribute('aria-disabled', 'true')
      host.append(link)
    }
    setAttr(host, 'label', props.label)
    if (props.onPageChange) {
      host.addEventListener('pagechange', (e) => {
        const detail = (e as CustomEvent).detail
        props.onPageChange!(detail.page, detail.event)
      })
    }
    target.append(host)
    return track({
      root: host,
      update: async (patch) => setAttr(host, 'label', patch.label),
      unmount: async () => host.remove(),
    } satisfies Mounted<PaginationProps>)
  },

  async steps(props, target) {
    const host = document.createElement('gg-steps')
    for (const step of props.items) {
      const item = document.createElement('div')
      item.dataset.state = step.state
      item.append(step.name)
      if (step.note) {
        const note = document.createElement('span')
        note.slot = 'note'
        note.textContent = step.note
        item.append(note)
      }
      host.append(item)
    }
    setAttr(host, 'label', props.label)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => setAttr(host, 'label', patch.label),
      unmount: async () => host.remove(),
    } satisfies Mounted<StepsProps>)
  },

  async toolbar(props, target) {
    const host = document.createElement('gg-toolbar')
    for (const label of props.tools ?? ['Move', 'Rotate', 'Scale']) {
      if (label === '|' || label === '>') {
        const span = document.createElement('span')
        span.toggleAttribute(label === '|' ? 'data-separator' : 'data-spacer', true)
        host.append(span)
        continue
      }
      const wrapper = document.createElement('gg-button')
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      wrapper.append(button)
      host.append(wrapper)
    }
    const apply = (patch: Partial<ToolbarProps>) => {
      if ('label' in patch) setAttr(host, 'label', patch.label)
      if ('orientation' in patch) setAttr(host, 'orientation', patch.orientation)
    }
    apply(props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => apply(patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<ToolbarProps>)
  },

  async checkboxGroup(props, target) {
    const host = optionsHost('gg-checkbox-group', props.items, props.defaultValue ?? [])
    applyRadioHost(host, props as Partial<RadioGroupProps>)
    if (props.onValueChange) host.addEventListener('valuechange', (e) => props.onValueChange!((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyRadioHost(host, patch as Partial<RadioGroupProps>),
      unmount: async () => host.remove(),
    } satisfies Mounted<CheckboxGroupProps>)
  },

  async fieldset(props, target) {
    const host = document.createElement('gg-fieldset')
    const checked = props.defaultValue === undefined ? [] : ([] as string[]).concat(props.defaultValue)
    const group = optionsHost(props.group === 'radio' ? 'gg-radio-group' : 'gg-checkbox-group', props.items, checked)
    setAttr(group, 'name', props.name)
    host.append(group)
    applyFieldsetHost(host, props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyFieldsetHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<FieldsetProps>)
  },

  async dialog(props, target) {
    const host = document.createElement(props.sheet ? 'gg-sheet' : 'gg-dialog')
    if (props.sheet && props.sheet !== true) host.setAttribute('side', props.sheet)
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

  async popover(props, target) {
    const host = document.createElement('gg-popover')
    const trigger = document.createElement('button')
    trigger.slot = 'trigger'
    trigger.textContent = props.trigger
    const text = document.createElement('p')
    text.textContent = props.body ?? 'Body'
    const inside = document.createElement('button')
    inside.type = 'button'
    inside.textContent = 'Inside'
    host.append(trigger, text, inside)
    setAttr(host, 'open', props.defaultOpen)
    applyPopoverHost(host, props)
    if (props.onOpenChange) {
      host.addEventListener('openchange', (e) => {
        const { open, reason } = (e as CustomEvent).detail
        props.onOpenChange!(open, { reason })
      })
    }
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyPopoverHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<PopoverProps>)
  },

  async badge(props, target) {
    const host = document.createElement('gg-badge')
    const apply = (p: Partial<BadgeProps>) => {
      if ('label' in p) host.textContent = p.label!
      if ('tone' in p) setAttr(host, 'tone', p.tone)
      if ('variant' in p) setAttr(host, 'variant', p.variant)
      if ('dot' in p) {
        setAttr(host, 'dot', p.dot === true)
        setAttr(host, 'no-dot', p.dot === false)
      }
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<BadgeProps>)
  },

  async avatar(props, target) {
    const host = document.createElement('gg-avatar')
    const apply = (p: Partial<AvatarProps>) => {
      if ('name' in p) setAttr(host, 'name', p.name)
      if ('src' in p) setAttr(host, 'src', p.src)
      if ('size' in p) setAttr(host, 'size', p.size)
      if ('decorative' in p) setAttr(host, 'decorative', p.decorative)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<AvatarProps>)
  },

  async avatarGroup(props, target) {
    const host = document.createElement('gg-avatar-group') as GgAvatarGroupElement
    const apply = (p: Partial<AvatarGroupProps>) => {
      if ('label' in p) setAttr(host, 'label', p.label)
      if ('max' in p) setAttr(host, 'max', p.max)
      if ('size' in p) setAttr(host, 'size', p.size)
      if ('people' in p) host.people = p.people!
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<AvatarGroupProps>)
  },

  async spinner(props, target) {
    const host = document.createElement('gg-spinner')
    const apply = (p: Partial<SpinnerProps>) => {
      if ('label' in p) setAttr(host, 'label', p.label)
      if ('size' in p) setAttr(host, 'size', p.size)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<SpinnerProps>)
  },

  async skeleton(props, target) {
    const host = document.createElement('gg-skeleton')
    const apply = (p: Partial<SkeletonProps>) => {
      if ('lines' in p) setAttr(host, 'lines', p.lines)
      if ('title' in p) setAttr(host, 'title', p.title)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<SkeletonProps>)
  },

  async card(props, target) {
    const host = document.createElement('gg-card')
    host.textContent = 'Body'
    const apply = (p: Partial<CardProps>) => {
      if ('title' in p) setAttr(host, 'heading', p.title)
      if ('subtitle' in p) setAttr(host, 'subtitle', p.subtitle)
      if ('headingLevel' in p) setAttr(host, 'heading-level', p.headingLevel)
      if ('interactive' in p) setAttr(host, 'interactive', p.interactive)
      if ('plain' in p) setAttr(host, 'plain', p.plain)
      if ('rank' in p) setAttr(host, 'rank', p.rank)
      if ('tone' in p) setAttr(host, 'tone', p.tone)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<CardProps>)
  },

  async panel(props, target) {
    const host = document.createElement('gg-panel')
    if (props.actions) {
      const refresh = document.createElement('button')
      refresh.type = 'button'
      refresh.slot = 'actions'
      refresh.textContent = 'Refresh'
      host.append(refresh)
    }
    host.append('Body')
    const apply = (p: Partial<PanelProps>) => {
      if ('title' in p) setAttr(host, 'heading', p.title)
      if ('headingLevel' in p) setAttr(host, 'heading-level', p.headingLevel)
      if ('body' in p) setAttr(host, 'body', p.body)
      if ('plain' in p) setAttr(host, 'plain', p.plain)
      if ('rank' in p) setAttr(host, 'rank', p.rank)
      if ('tone' in p) setAttr(host, 'tone', p.tone)
      if ('region' in p) setAttr(host, 'region', p.region)
      if ('scrollable' in p) setAttr(host, 'scrollable', p.scrollable)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<PanelProps>)
  },

  async banner(props, target) {
    const host = document.createElement('gg-banner')
    if (props.text !== undefined) host.append(props.text)
    if (props.actions) {
      const renew = document.createElement('button')
      renew.type = 'button'
      renew.slot = 'actions'
      renew.textContent = 'Renew'
      host.append(renew)
    }
    let current = props
    const apply = (p: Partial<BannerProps>) => {
      if ('tone' in p) setAttr(host, 'tone', p.tone)
      if ('title' in p) setAttr(host, 'heading', p.title)
      if ('live' in p) setAttr(host, 'live', p.live)
      if ('dismissLabel' in p) setAttr(host, 'dismiss-label', p.dismissLabel)
      if ('onDismiss' in p) setAttr(host, 'dismissible', !!p.onDismiss)
    }
    // The owner decides what closing means, as React and Svelte owners do: the element does not hide itself.
    host.addEventListener('dismiss', (event) => {
      event.preventDefault()
      current.onDismiss?.()
    })
    apply(props)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => {
        current = { ...current, ...patch }
        apply(patch)
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<BannerProps>)
  },

  async note(props, target) {
    const host = document.createElement('gg-note')
    host.append(props.text)
    const apply = (p: Partial<NoteProps>) => {
      if ('tone' in p) setAttr(host, 'tone', p.tone)
      if ('live' in p) setAttr(host, 'live', p.live)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<NoteProps>)
  },

  async emptyState(props, target) {
    const host = document.createElement('gg-empty-state')
    if (props.action !== undefined) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = props.action
      host.append(button)
    }
    const apply = (p: Partial<EmptyStateProps>) => {
      if ('title' in p) setAttr(host, 'heading', p.title)
      if ('description' in p) setAttr(host, 'description', p.description)
      if ('headingLevel' in p) setAttr(host, 'heading-level', p.headingLevel)
      if ('live' in p) setAttr(host, 'live', p.live)
    }
    apply(props)
    target.append(host)
    return track({ root: host, update: async (patch) => apply(patch), unmount: async () => host.remove() } satisfies Mounted<EmptyStateProps>)
  },

  async toaster(props, target) {
    const host = document.createElement('gg-toaster') as GgToasterElement
    host.toaster = props.toaster
    setAttr(host, 'placement', props.placement)
    setAttr(host, 'label', props.label)
    target.append(host)
    return track({
      root: host,
      update: async (patch) => {
        if ('placement' in patch) setAttr(host, 'placement', patch.placement)
        if ('label' in patch) setAttr(host, 'label', patch.label)
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<ToasterProps>)
  },

  async tabs(props, target) {
    const host = document.createElement('gg-tabs') as GgTabsElement
    let current = props
    const panels = props.panels ?? true
    // Panels as an author writes them: a child per tab, which the element reads.
    const writePanels = (items: TabsProps['items']) => {
      const existing = new Map([...host.querySelectorAll<HTMLElement>(':scope > [data-tab]')].map((el) => [el.dataset.tab!, el]))
      for (const [value, el] of existing) if (!items.some((item) => item.value === value)) el.remove()
      for (const item of items) {
        const el = existing.get(item.value) ?? document.createElement('section')
        el.dataset.tab = item.value
        el.dataset.label = item.label
        for (const flag of ['disabled', 'closable', 'modified'] as const) el.toggleAttribute(`data-${flag}`, !!item[flag])
        el.textContent = `Panel ${item.label}`
        host.append(el)
      }
    }
    if (panels) writePanels(props.items)
    else host.items = props.items
    setAttr(host, 'value', props.value ?? props.defaultValue)
    setAttr(host, 'label', props.label)
    setAttr(host, 'orientation', props.orientation)
    setAttr(host, 'activation', props.activation)
    setAttr(host, 'variant', props.variant)
    host.addEventListener('valuechange', (e) => current.onValueChange?.((e as CustomEvent).detail.value))
    host.addEventListener('tabclose', (e) => current.onClose?.((e as CustomEvent).detail.value))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => {
        current = { ...current, ...patch }
        if ('items' in patch) {
          if (panels) writePanels(patch.items!)
          else host.items = patch.items!
        }
        if ('value' in patch) setAttr(host, 'value', patch.value)
        if ('orientation' in patch) setAttr(host, 'orientation', patch.orientation)
        if ('activation' in patch) setAttr(host, 'activation', patch.activation)
        // The element hears its panels through a MutationObserver, a microtask later.
        await Promise.resolve()
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<TabsProps>)
  },

  async menubar(props, target) {
    const host = document.createElement('gg-menubar') as GgMenubarElement
    let current = props
    const apply = (patch: Partial<MenubarProps>) => {
      if ('menus' in patch) host.menus = patch.menus!
      if ('label' in patch) setAttr(host, 'label', patch.label)
      if ('mnemonics' in patch) setAttr(host, 'mnemonics', patch.mnemonics)
      if ('closeOnSelect' in patch) setAttr(host, 'keep-open', patch.closeOnSelect === false)
    }
    apply(props)
    host.addEventListener('itemselect', (e) => {
      const { value, ...details } = (e as CustomEvent).detail
      current.onSelect?.(value, details)
    })
    host.addEventListener('openchange', (e) => current.onOpenChange?.((e as CustomEvent).detail.menu))
    target.append(host)
    return track({
      root: host,
      update: async (patch) => {
        current = { ...current, ...patch }
        apply(patch)
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<MenubarProps>)
  },

  async menu(props, target) {
    const host = document.createElement('gg-menu') as GgMenuElement
    const trigger = document.createElement('button')
    trigger.slot = 'trigger'
    trigger.textContent = props.trigger
    host.append(trigger)
    setAttr(host, 'open', props.defaultOpen)
    applyMenuHost(host, props)
    let current = props
    host.addEventListener('openchange', (e) => {
      const { open, reason } = (e as CustomEvent).detail
      current.onOpenChange?.(open, { reason })
    })
    host.addEventListener('itemselect', (e) => {
      const { value, ...details } = (e as CustomEvent).detail
      current.onSelect?.(value, details)
    })
    target.append(host)
    return track({
      root: host,
      update: async (patch) => {
        current = { ...current, ...patch }
        applyMenuHost(host, patch)
      },
      unmount: async () => host.remove(),
    } satisfies Mounted<MenuProps>)
  },

  async tooltip(props, target) {
    const host = document.createElement('gg-tooltip')
    const trigger = document.createElement('button')
    trigger.textContent = props.trigger
    host.append(trigger)
    applyTooltipHost(host, props)
    if (props.onOpenChange) {
      host.addEventListener('openchange', (e) => {
        const { open, reason } = (e as CustomEvent).detail
        props.onOpenChange!(open, { reason })
      })
    }
    target.append(host)
    return track({
      root: host,
      update: async (patch) => applyTooltipHost(host, patch),
      unmount: async () => host.remove(),
    } satisfies Mounted<TooltipProps>)
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
    } else if (props.search) {
      const wrapper = searchHost(props.search)
      applySearchHost(wrapper, props.search)
      host.append(wrapper)
    } else if (props.fileDrop) {
      const wrapper = fileDropHost(props.fileDrop)
      applyFileDropHost(wrapper, props.fileDrop)
      host.append(wrapper)
    } else if (props.slider) {
      host.append(sliderHost(props.slider))
      applySliderHost(host.lastElementChild as HTMLElement, props.slider)
    } else if (props.numberField) {
      host.append(numberHost(props.numberField))
      applyNumberHost(host.lastElementChild as HTMLElement, props.numberField)
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
