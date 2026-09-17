import { act, createElement, type ComponentType, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, ChipGroup, Field, Input, Select, Textarea } from '../../../packages/react/src/index'
import { type Adapter, type ButtonProps, type FieldProps, type Mounted, track } from '../harness'

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
  supports: { controlled: true },

  async act(interaction) {
    await act(async () => interaction())
  },

  button: (props, target) =>
    mount(Button, props, target, ({ label, ...rest }: ButtonProps) => [rest, label]),
  select: (props, target) => mount(Select, props, target),
  chipGroup: (props, target) => mount(ChipGroup, props, target),
  input: (props, target) => mount(Input, props, target),
  textarea: (props, target) => mount(Textarea, props, target),
  field: (props, target) =>
    mount(Field, props, target, ({ input, textarea, ...field }: FieldProps) => [
      field,
      textarea ? createElement(Textarea, textarea) : createElement(Input, input ?? {}),
    ]),
}
