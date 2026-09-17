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
  ButtonGroup,
  ChoiceCardGroup,
  FileDrop,
  InputGroup,
  NumberField,
  RadioGroup,
  Search,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  Tabs,
  Toaster,
  Avatar,
  Banner,
  Card,
  EmptyState,
  Note,
  Panel,
  AvatarGroup,
  Badge,
  Skeleton,
  Spinner,
  Textarea,
} from '../../../packages/react/src/index'
import {
  type Adapter,
  type ButtonGroupProps,
  type ButtonProps,
  type InputGroupProps,
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
  supports: { controlled: true, refusal: true, linkRoot: true },

  async act(interaction) {
    await act(async () => interaction())
  },

  async wait(ms) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms))
    })
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
  segmentedControl: (props, target) => mount(SegmentedControl, props, target),
  slider: (props, target) => mount(Slider, props, target),
  numberField: (props, target) => mount(NumberField, props, target),
  choiceCards: (props, target) => mount(ChoiceCardGroup, props, target),
  search: (props, target) => mount(Search, props, target),
  inputGroup: (props, target) =>
    mount(InputGroup, props, target, ({ input, ...rest }: InputGroupProps) => [rest, createElement(Input, input ?? {})]),
  fileDrop: (props, target) => mount(FileDrop, props, target),
  buttonGroup: (props, target) =>
    mount(ButtonGroup, props, target, ({ buttons, ...rest }: ButtonGroupProps) => [
      rest,
      (buttons ?? ['One', 'Two', 'Three']).map((label) => createElement(Button, { key: label }, label)),
    ]),
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
  toaster: (props, target) => mount(Toaster, props, target),
  badge: (props, target) => mount(Badge, props, target, ({ label, ...rest }: { label: string }) => [rest, label]),
  avatar: (props, target) => mount(Avatar, props, target),
  avatarGroup: (props, target) => mount(AvatarGroup, props, target),
  spinner: (props, target) => mount(Spinner, props, target),
  skeleton: (props, target) => mount(Skeleton, props, target),
  card: (props, target) => mount(Card, props, target, (p) => [p, 'Body']),
  panel: (props, target) =>
    mount(Panel, props, target, ({ actions, ...rest }: { actions?: boolean }) => [
      { ...rest, actions: actions ? createElement('button', { type: 'button' }, 'Refresh') : undefined },
      'Body',
    ]),
  banner: (props, target) =>
    mount(Banner, props, target, ({ text, actions, ...rest }: { text?: string; actions?: boolean }) => [
      { ...rest, actions: actions ? createElement('button', { type: 'button' }, 'Renew') : undefined },
      ...(text === undefined ? [] : [text]),
    ]),
  note: (props, target) => mount(Note, props, target, ({ text, ...rest }: { text: string }) => [rest, text]),
  emptyState: (props, target) =>
    mount(EmptyState, props, target, ({ action, ...rest }: { action?: string }) => [
      rest,
      ...(action === undefined ? [] : [createElement('button', { type: 'button' }, action)]),
    ]),
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
      if (props.search) return [field, createElement(Search, props.search)]
      if (props.fileDrop) return [field, createElement(FileDrop, props.fileDrop)]
      if (props.slider) return [field, createElement(Slider, props.slider)]
      if (props.numberField) return [field, createElement(NumberField, props.numberField)]
      return [field, textarea ? createElement(Textarea, textarea) : createElement(Input, input ?? {})]
    }),
}
