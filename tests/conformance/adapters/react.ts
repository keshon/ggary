import { act, createElement, type ComponentType, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Button,
  Checkbox,
  CheckboxGroup,
  ChipGroup,
  Dialog,
  Popover,
  Sheet,
  Tooltip,
  Field,
  Fieldset,
  Input,
  Menu,
  Menubar,
  RadioGroup,
  Select,
  Switch,
  Tabs,
  Textarea,
} from '../../../packages/react/src/index'
import {
  type Adapter,
  type ButtonProps,
  type CheckboxProps,
  type DialogProps,
  type FieldProps,
  type FieldsetProps,
  type MenuProps,
  type Mounted,
  type PopoverProps,
  type TooltipProps,
  type TabsProps,
  track,
} from '../harness'

/**
 * React: every render and every interaction goes through `act`, which flushes
 * state updates AND effects before returning. Without it the layout effect that
 * moves roving focus, and the effects that sync props into the machine, would
 * still be pending when the spec asserts.
 */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function mount<P extends object>(
  component: ComponentType<any>,
  props: P,
  target: HTMLElement,
  toElementProps: (props: P) => [object, ...ReactNode[]] = (p) => [p]
): Promise<Mounted<P>> {
  const host = document.createElement('div')
  target.append(host)
  const root = createRoot(host)
  let current = props

  const render = () => {
    const [elementProps, ...children] = toElementProps(current)
    root.render(createElement(component, elementProps, ...children))
  }
  await act(async () => render())

  return track({
    root: host,
    async update(patch) {
      current = { ...current, ...patch }
      await act(async () => render())
    },
    async unmount() {
      await act(async () => root.unmount())
      host.remove()
    },
  })
}

export const react: Adapter = {
  name: 'react',
  supports: { controlled: true, refusal: true },

  async act(interaction) {
    await act(async () => interaction())
  },

  button: (props, target) =>
    mount(Button, props, target, ({ label, ...rest }: ButtonProps) => [rest, label]),
  select: (props, target) => mount(Select, props, target),
  chipGroup: (props, target) => mount(ChipGroup, props, target),
  input: (props, target) => mount(Input, props, target),
  textarea: (props, target) => mount(Textarea, props, target),
  checkbox: (props, target) => mount(Checkbox, props, target, ({ label, ...rest }: CheckboxProps) => [rest, label]),
  switch: (props, target) => mount(Switch, props, target, ({ label, ...rest }: CheckboxProps) => [rest, label]),
  radioGroup: (props, target) => mount(RadioGroup, props, target),
  checkboxGroup: (props, target) => mount(CheckboxGroup, props, target),
  fieldset: (props, target) =>
    mount(Fieldset, props, target, ({ group, items, name, defaultValue, ...fieldset }: FieldsetProps) => [
      fieldset,
      group === 'radio'
        ? createElement(RadioGroup, { items, name, defaultValue: defaultValue as string | undefined })
        : createElement(CheckboxGroup, { items, name, defaultValue: defaultValue as string[] | undefined }),
    ]),
  dialog: (props, target) =>
    mount(props.sheet ? Sheet : Dialog, props, target, ({ trigger, triggerIsButton, body, footer, sheet, ...rest }: DialogProps) => [
      {
        ...rest,
        ...(sheet && sheet !== true ? { side: sheet } : {}),
        trigger: trigger
          ? (triggerProps: object) => createElement(triggerIsButton ? Button : 'button', triggerProps, trigger)
          : undefined,
        footer: footer ? createElement('button', { type: 'button' }, footer) : undefined,
      },
      createElement('p', null, body ?? 'Body'),
      createElement('button', { type: 'button' }, 'Body action'),
    ]),
  popover: (props, target) =>
    mount(Popover, props, target, ({ trigger, body, ...rest }: PopoverProps) => [
      { ...rest, trigger: (triggerProps: object) => createElement('button', triggerProps, trigger) },
      createElement('p', null, body ?? 'Body'),
      createElement('button', { type: 'button' }, 'Inside'),
    ]),
  tooltip: (props, target) =>
    mount(Tooltip, props, target, ({ trigger, ...rest }: TooltipProps) => [
      { ...rest, trigger: (triggerProps: object) => createElement('button', triggerProps, trigger) },
    ]),
  menubar: (props, target) => mount(Menubar, props, target),
  tabs: (props, target) =>
    mount(Tabs, props, target, ({ panels = true, ...rest }: TabsProps) => [
      panels ? { ...rest, children: (item: { label: string }) => `Panel ${item.label}` } : rest,
    ]),
  menu: (props, target) =>
    mount(Menu, props, target, ({ trigger, ...rest }: MenuProps) => [
      { ...rest, trigger: (triggerProps: object) => createElement('button', triggerProps, trigger) },
    ]),
  field: (props, target) =>
    mount(Field, props, target, ({ input, textarea, checkbox, switch: switchProps, ...field }: FieldProps) => {
      if (checkbox || switchProps) {
        const { label, ...rest } = (checkbox ?? switchProps)!
        return [field, createElement((checkbox ? Checkbox : Switch) as ComponentType<any>, rest, label)]
      }
      return [field, textarea ? createElement(Textarea, textarea) : createElement(Input, input ?? {})]
    }),
}
