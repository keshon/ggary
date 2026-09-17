import { createRawSnippet, flushSync, mount, unmount, type Component } from 'svelte'
import { Avatar, AvatarGroup, Badge, Button, Checkbox, CheckboxGroup, ChipGroup, Input, Menubar, RadioGroup, Select, Skeleton, Spinner, Switch, Textarea, Toaster } from '../../../packages/svelte/src/index'
import FieldWithControl from './FieldWithControl.svelte'
import DialogWithContent from './DialogWithContent.svelte'
import PopoverWithContent from './PopoverWithContent.svelte'
import TooltipWithTrigger from './TooltipWithTrigger.svelte'
import MenuWithTrigger from './MenuWithTrigger.svelte'
import TabsWithPanels from './TabsWithPanels.svelte'
import FieldsetWithGroup from './FieldsetWithGroup.svelte'
import { type Adapter, type ButtonProps, type CheckboxProps, type Mounted, track } from '../harness'
import { reactiveProps } from './svelte-props.svelte'

/**
 * Svelte 5: effects are batched onto a microtask, so every interaction and every
 * prop change ends with `flushSync()` — the Svelte equivalent of React's `act`.
 * Props are a `$state` object, so `Object.assign` on it IS a prop update.
 */

async function mountSvelte<P extends object>(
  component: Component<any>,
  props: P,
  target: HTMLElement,
  toComponentProps: (props: P) => object = (p) => p
): Promise<Mounted<P>> {
  const host = document.createElement('div')
  target.append(host)
  const reactive = reactiveProps({ ...toComponentProps(props) } as Record<string, unknown>)
  const instance = mount(component, { target: host, props: reactive })
  flushSync()

  return track({
    root: host,
    async update(patch) {
      Object.assign(reactive, toComponentProps(patch as P))
      flushSync()
    },
    async unmount() {
      await unmount(instance)
      host.remove()
    },
  })
}

// A label becomes a snippet, the Svelte 5 form of children.
const text = (label: string) =>
  createRawSnippet(() => ({ render: () => `<span>${label}</span>` }))

const withLabel = (p: Partial<CheckboxProps>) => {
  const { label, ...rest } = p
  return label === undefined ? rest : { ...rest, children: text(label) }
}

export const svelte: Adapter = {
  name: 'svelte',
  supports: { controlled: true, refusal: false },

  async act(interaction) {
    interaction()
    flushSync()
  },

  async wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms))
    flushSync()
  },

  button: (props, target) =>
    mountSvelte(Button as Component<any>, props, target, (p: Partial<ButtonProps>) => {
      const { label, ...rest } = p
      return label === undefined ? rest : { ...rest, children: text(label) }
    }),
  select: (props, target) => mountSvelte(Select as Component<any>, props, target),
  chipGroup: (props, target) => mountSvelte(ChipGroup as Component<any>, props, target),
  input: (props, target) => mountSvelte(Input as Component<any>, props, target),
  textarea: (props, target) => mountSvelte(Textarea as Component<any>, props, target),
  checkbox: (props, target) => mountSvelte(Checkbox as Component<any>, props, target, withLabel),
  switch: (props, target) => mountSvelte(Switch as Component<any>, props, target, withLabel),
  radioGroup: (props, target) => mountSvelte(RadioGroup as Component<any>, props, target),
  checkboxGroup: (props, target) => mountSvelte(CheckboxGroup as Component<any>, props, target),
  fieldset: (props, target) => mountSvelte(FieldsetWithGroup as Component<any>, props, target),
  // Snippets for the trigger, body and footer, as an app writes them.
  dialog: (props, target) => mountSvelte(DialogWithContent as Component<any>, props, target),
  popover: (props, target) => mountSvelte(PopoverWithContent as Component<any>, props, target),
  tooltip: (props, target) => mountSvelte(TooltipWithTrigger as Component<any>, props, target),
  menu: (props, target) => mountSvelte(MenuWithTrigger as Component<any>, props, target),
  menubar: (props, target) => mountSvelte(Menubar as Component<any>, props, target),
  tabs: (props, target) => mountSvelte(TabsWithPanels as Component<any>, props, target),
  toaster: (props, target) => mountSvelte(Toaster as Component<any>, props, target),
  badge: (props, target) =>
    mountSvelte(Badge as Component<any>, props, target, ({ label, ...rest }) => (label === undefined ? rest : { ...rest, children: text(label) })),
  avatar: (props, target) => mountSvelte(Avatar as Component<any>, props, target),
  avatarGroup: (props, target) => mountSvelte(AvatarGroup as Component<any>, props, target),
  spinner: (props, target) => mountSvelte(Spinner as Component<any>, props, target),
  skeleton: (props, target) => mountSvelte(Skeleton as Component<any>, props, target),
  // A Field's children are a snippet, and a raw snippet cannot render a
  // component, so a two-line wrapper composes the pair as an app would.
  field: (props, target) => mountSvelte(FieldWithControl as Component<any>, props, target),
}
