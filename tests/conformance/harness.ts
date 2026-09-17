/**
 * The conformance harness.
 *
 * Every spec in this folder is written ONCE against this interface and runs
 * against every adapter. The interface hides the three things that genuinely
 * differ between frameworks — how a component is mounted, how new props reach
 * it, and when its effects have flushed — and nothing else. If a spec needs to
 * know which framework it is talking to, the spec is testing an adapter detail
 * rather than the kit's contract, and belongs in an adapter-specific file.
 *
 * Why this exists: every adapter bug found so far was DRIFT. The vanilla Select
 * forgot its empty state; the tab stop vanished only when items arrived late,
 * which only one adapter did. A suite that ran against one renderer could not see
 * either until someone went looking.
 */
import type { ChipGroupMode, ChipGroupOrientation, ChipItem } from '../../packages/core/src/components/chip-group'
import type { SelectItem } from '../../packages/core/src/components/select'
import type { ButtonEmphasis, ButtonSize, ButtonTone } from '../../packages/core/src/components/button'
import type { InputSize, InputType } from '../../packages/core/src/components/input'
import type { TextareaResize, TextareaSize } from '../../packages/core/src/components/textarea'
import type { CheckedState } from '../../packages/core/src/components/checkbox'
import type { RadioGroupOrientation, RadioItem } from '../../packages/core/src/components/radio-group'
import type { MenuEntry, MenuItem } from '../../packages/core/src/components/menu'
import type { MenubarMenu } from '../../packages/core/src/components/menubar'
import type { TabItem, TabsActivation, TabsOrientation, TabsVariant } from '../../packages/core/src/components/tabs'
import type { Toaster, ToastPlacement } from '../../packages/core/src/components/toast'

export interface ButtonProps {
  label: string
  emphasis?: ButtonEmphasis
  tone?: ButtonTone
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
}

export interface SelectProps {
  items: SelectItem[]
  label?: string
  placeholder?: string
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  name?: string
  onValueChange?: (value: string | null, item: SelectItem | null) => void
}

export interface ChipGroupProps {
  items: ChipItem[]
  label?: string
  mode?: ChipGroupMode
  orientation?: ChipGroupOrientation
  removable?: boolean
  disabled?: boolean
  name?: string
  value?: string[]
  defaultValue?: string[]
  onSelectionChange?: (selection: string[], items: ChipItem[]) => void
  onRemove?: (value: string, item: ChipItem | null) => void
}

export interface InputProps {
  type?: InputType
  size?: InputSize
  name?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export interface TextareaProps {
  size?: TextareaSize
  name?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  resize?: TextareaResize
  autoResize?: boolean
  maxRows?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

/** Checkbox and Switch share a shape; `label` is the text beside the box. */
export interface CheckboxProps {
  label?: string
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: boolean) => void
  name?: string
  value?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}

export interface SwitchProps extends Omit<CheckboxProps, 'checked' | 'defaultChecked'> {
  checked?: boolean
  defaultChecked?: boolean
}

export interface RadioGroupProps {
  items: RadioItem[]
  name?: string
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  label?: string
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

export interface CheckboxGroupProps {
  items: RadioItem[]
  name?: string
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  label?: string
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

/** A Fieldset around one option group — radios or checkboxes — which is what it exists for. */
export interface FieldsetProps {
  legend?: string
  hint?: string
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  group: 'radio' | 'checkbox'
  items: RadioItem[]
  name?: string
  /** Read at mount only. */
  defaultValue?: string | string[]
}

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
  title?: string
  description?: string
  /** Body text. The body also holds one button, "Body action". */
  body?: string
  /** A button in the footer, with this label. */
  footer?: string
  /** A trigger button, with this label. */
  trigger?: string
  /** Make the trigger the kit's own Button, to test composition. */
  triggerIsButton?: boolean
  modal?: boolean
  role?: 'dialog' | 'alertdialog'
  /** Mount the Sheet component (Sheet, <gg-sheet>) at this side instead of a Dialog. */
  sheet?: 'start' | 'end' | true
  closeOnEscape?: boolean
  closeOnOutside?: boolean
}

export interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
  /** The trigger button's label. */
  trigger: string
  title?: string
  /** Content text. The content also holds one button, "Inside". */
  body?: string
  placement?: string
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  closeButton?: boolean
}

export interface MenuProps {
  items: MenuEntry[]
  /** The trigger button's label. */
  trigger: string
  onSelect?: (value: string, details: { item: MenuItem; checked?: boolean }) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
  placement?: string
  closeOnSelect?: boolean
  label?: string
}

export interface MenubarProps {
  menus: MenubarMenu[]
  onSelect?: (value: string, details: { item: MenuItem; checked?: boolean; menu: string }) => void
  onOpenChange?: (menu: string | null) => void
  label?: string
  mnemonics?: boolean
  closeOnSelect?: boolean
}

export interface TabsProps {
  items: TabItem[]
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  onClose?: (value: string) => void
  label?: string
  orientation?: TabsOrientation
  activation?: TabsActivation
  variant?: TabsVariant
  /** Render a panel per tab reading "Panel <label>". Default true; false for tabs without panels. */
  panels?: boolean
}

export interface ToasterProps {
  /** A queue of the test's own, so tests do not share the page's toaster. */
  toaster: Toaster
  placement?: ToastPlacement
  label?: string
}

export interface TooltipProps {
  content: string
  /** The trigger button's label. */
  trigger: string
  openDelay?: number
  closeDelay?: number
  disabled?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
}

/**
 * A Field wrapping one control: a Textarea, Checkbox or Switch when that key is
 * given, otherwise an Input configured by `input`.
 */
export interface FieldProps {
  label?: string
  hint?: string
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  input?: InputProps
  textarea?: TextareaProps
  checkbox?: CheckboxProps
  switch?: SwitchProps
}

export interface Mounted<P> {
  /** The element the component was rendered into. Specs query inside it. */
  root: HTMLElement
  /** Push new props the way the framework would, and wait until they settle. */
  update(patch: Partial<P>): Promise<void>
  unmount(): Promise<void>
}

export interface Adapter {
  name: 'elements' | 'react' | 'svelte'

  /**
   * What the adapter's public API can express. A spec skips a case the adapter
   * cannot express — and says so in the test name — rather than faking it.
   * Custom elements have no controlled mode: an attribute cannot be owned by
   * the page and the element at once.
   */
  supports: {
    controlled: boolean
    /**
     * The owner can REFUSE a change: pass a `value`, ignore the callback, and the
     * component keeps showing the owner's value. React only. Svelte's `bind:`
     * model writes the change back, and the custom elements follow their own
     * attributes, so there a change the owner ignores still moves the component.
     */
    refusal: boolean
  }

  /** Run a user interaction and wait for everything it causes to flush. */
  act(interaction: () => void): Promise<void>

  /** Let time pass — timers fire — and flush what they caused, as inside act. */
  wait(ms: number): Promise<void>

  button(props: ButtonProps, target: HTMLElement): Promise<Mounted<ButtonProps>>
  select(props: SelectProps, target: HTMLElement): Promise<Mounted<SelectProps>>
  chipGroup(props: ChipGroupProps, target: HTMLElement): Promise<Mounted<ChipGroupProps>>
  input(props: InputProps, target: HTMLElement): Promise<Mounted<InputProps>>
  textarea(props: TextareaProps, target: HTMLElement): Promise<Mounted<TextareaProps>>
  checkbox(props: CheckboxProps, target: HTMLElement): Promise<Mounted<CheckboxProps>>
  switch(props: SwitchProps, target: HTMLElement): Promise<Mounted<SwitchProps>>
  radioGroup(props: RadioGroupProps, target: HTMLElement): Promise<Mounted<RadioGroupProps>>
  checkboxGroup(props: CheckboxGroupProps, target: HTMLElement): Promise<Mounted<CheckboxGroupProps>>
  /** Updates apply to the Fieldset's own props; the group inside is read at mount only. */
  fieldset(props: FieldsetProps, target: HTMLElement): Promise<Mounted<FieldsetProps>>
  dialog(props: DialogProps, target: HTMLElement): Promise<Mounted<DialogProps>>
  popover(props: PopoverProps, target: HTMLElement): Promise<Mounted<PopoverProps>>
  tooltip(props: TooltipProps, target: HTMLElement): Promise<Mounted<TooltipProps>>
  menu(props: MenuProps, target: HTMLElement): Promise<Mounted<MenuProps>>
  menubar(props: MenubarProps, target: HTMLElement): Promise<Mounted<MenubarProps>>
  tabs(props: TabsProps, target: HTMLElement): Promise<Mounted<TabsProps>>
  toaster(props: ToasterProps, target: HTMLElement): Promise<Mounted<ToasterProps>>
  /** Updates apply to the Field's own props; the control's props are read at mount only. */
  field(props: FieldProps, target: HTMLElement): Promise<Mounted<FieldProps>>
}

// --- lifecycle -----------------------------------------------------------------

/**
 * Every mount is tracked and torn down after each test.
 *
 * Removing a component's DOM is not unmounting it. An open Select that is merely
 * detached keeps its document-level Escape and pointerdown listeners, and the NEXT
 * test's keypress drives the previous test's machine — which is exactly how the
 * first run of this suite produced React "not wrapped in act" warnings from a
 * select no test was looking at.
 */
const live = new Set<Mounted<any>>()

export function track<P>(mounted: Mounted<P>): Mounted<P> {
  const unmount = mounted.unmount
  const tracked: Mounted<P> = {
    ...mounted,
    async unmount() {
      if (!live.delete(tracked)) return
      await unmount()
    },
  }
  live.add(tracked)
  return tracked
}

export async function cleanup(): Promise<void> {
  for (const mounted of [...live]) await mounted.unmount()
  document.body.replaceChildren()
}

// --- helpers shared by the specs ---------------------------------------------

export const keydown = (target: Element, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

export const click = (target: Element) => (target as HTMLElement).click()

/**
 * Type into a native input the way a user does, for every framework. The value
 * is written through the prototype's setter, not the element's own property:
 * React tracks the last value it rendered on the instance, and a plain
 * `el.value = x` would update that tracker too, so React would see no change and
 * never call onChange.
 */
export function typeInto(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!
  setter.call(input, text)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * The first element that is this part — the root itself included, since a
 * custom element that enhances its host (gg-field, gg-radio-group) IS the part.
 */
export const part = (root: ParentNode, scope: string, name: string) => {
  const selector = `[data-scope="${scope}"][data-part="${name}"]`
  return root instanceof HTMLElement && root.matches(selector) ? root : root.querySelector<HTMLElement>(selector)
}

export const parts = (root: ParentNode, scope: string, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`),
]

/** A mount point for one test. Teardown is `cleanup`, run after each test. */
export function freshTarget(tag: 'div' | 'form' = 'div'): HTMLElement {
  const target = document.createElement(tag)
  document.body.append(target)
  return target
}
