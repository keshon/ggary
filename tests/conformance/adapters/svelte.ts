import { createRawSnippet, flushSync, mount, unmount, type Component } from 'svelte'
import { Button, ChipGroup, Input, Select, Textarea } from '../../../packages/svelte/src/index'
import FieldWithControl from './FieldWithControl.svelte'
import { type Adapter, type ButtonProps, type Mounted, track } from '../harness'
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

export const svelte: Adapter = {
  name: 'svelte',
  supports: { controlled: true },

  async act(interaction) {
    interaction()
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
  // A Field's children are a snippet, and a raw snippet cannot render a
  // component, so a two-line wrapper composes the pair as an app would.
  field: (props, target) => mountSvelte(FieldWithControl as Component<any>, props, target),
}
