import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount, type Component } from 'svelte'
import { CheckboxGroup, ChipGroup, RadioGroup, Select } from '../packages/svelte/src/index'
import { reactiveProps } from './conformance/adapters/svelte-props.svelte'

/**
 * Svelte's `bind:` writes a component's value back into its owner's state. The
 * harness passes a `$state` props object, which is exactly what a binding is, so
 * a write to it here is a write to the owner's variable.
 */
// jsdom has no layout; positioning is the browser suite's question (see conformance.dom.test.ts).
vi.mock('../packages/core/src/utils/position', () => ({ attachPositioner: () => () => {} }))

const mounted: ReturnType<typeof mount>[] = []
afterEach(() => {
  mounted.splice(0).forEach((instance) => unmount(instance))
  document.body.replaceChildren()
})

function render<P extends Record<string, unknown>>(component: Component<any>, initial: P) {
  const target = document.createElement('div')
  document.body.append(target)
  const props = reactiveProps(initial)
  mounted.push(mount(component, { target, props }))
  flushSync()
  return { target, props }
}

const act = (fn: () => void) => {
  fn()
  flushSync()
}

describe('Svelte bind:value', () => {
  const items = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Bravo' },
  ]

  it('Select writes the chosen value into the binding, and follows it back', () => {
    const { target, props } = render(Select as Component<any>, { items, value: null as string | null })
    act(() => (target.querySelector('[data-part="trigger"]') as HTMLElement).click())
    act(() => (target.querySelectorAll('[data-part="item"]')[1] as HTMLElement).click())
    expect(props.value).toBe('b')
    act(() => (props.value = 'a'))
    expect(target.querySelector('[data-part="trigger"]')!.textContent).toContain('Alpha')
  })

  it('ChipGroup writes the selection into the binding', () => {
    const { target, props } = render(ChipGroup as Component<any>, { items, mode: 'multi', value: [] as string[] })
    act(() => (target.querySelectorAll('[data-scope="chip"][data-part="root"]')[1] as HTMLElement).click())
    expect(props.value).toEqual(['b'])
  })

  it('RadioGroup and CheckboxGroup write theirs', () => {
    const radios = render(RadioGroup as Component<any>, { items, value: null as string | null })
    act(() => (radios.target.querySelectorAll('input')[0] as HTMLInputElement).click())
    expect(radios.props.value).toBe('a')

    const boxes = render(CheckboxGroup as Component<any>, { items, value: [] as string[] })
    act(() => (boxes.target.querySelectorAll('input')[1] as HTMLInputElement).click())
    expect(boxes.props.value).toEqual(['b'])
  })
})
