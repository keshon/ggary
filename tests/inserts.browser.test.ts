import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Inserts } from '../packages/react/src/index'

/**
 * Inserts where only a browser can say: a controlled React textarea typed into
 * by a real keyboard, the caret put in the middle, a real press on an insert —
 * and React's own state, not just the DOM, holding the result.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount() {
  const seen: string[] = []
  function Template() {
    const [text, setText] = useState('')
    seen.push(text)
    return h(
      'div',
      null,
      h('textarea', { id: 'tpl', value: text, onChange: (e: { target: HTMLTextAreaElement }) => setText(e.target.value), rows: 3 }),
      h(Inserts, {
        target: 'tpl',
        label: 'Variables',
        items: [{ value: '{{name}}' }, { value: '{{status}}', hint: 'The state' }],
      }),
      h('output', null, text)
    )
  }
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  root.render(h(Template))
  await wait(30)
  const field = host.querySelector('textarea')!
  const insert = (label: string) =>
    [...host.querySelectorAll<HTMLButtonElement>('[data-scope="inserts"][data-part="item"]')].find((b) => b.textContent === label)!
  const state = () => host.querySelector('output')!.textContent
  return { field, insert, state, seen }
}

describe('inserts', () => {
  it('lands at the caret of a controlled React field, caret after it, focus back, state updated', async () => {
    const { field, insert, state } = await mount()
    await userEvent.click(field)
    await userEvent.keyboard('Hello world')
    expect(state()).toBe('Hello world')

    // The caret between "Hello " and "world".
    field.setSelectionRange(6, 6)
    await userEvent.click(insert('{{name}}'))
    await wait(10)
    expect(field.value).toBe('Hello {{name}}world')
    expect(state()).toBe('Hello {{name}}world')
    expect(document.activeElement).toBe(field)
    expect(field.selectionStart).toBe(14)
    expect(field.selectionEnd).toBe(14)

    // Typing goes on from the caret: React did not move it on the re-render.
    await userEvent.keyboard(', ')
    expect(state()).toBe('Hello {{name}}, world')
  })

  it('replaces a selection, and a keyboard press on the button works the same', async () => {
    const { field, insert, state } = await mount()
    await userEvent.click(field)
    await userEvent.keyboard('state: unknown')
    field.setSelectionRange(7, 14)
    insert('{{status}}').focus()
    await userEvent.keyboard('{Enter}')
    await wait(10)
    expect(state()).toBe('state: {{status}}')
    expect(document.activeElement).toBe(field)
    expect(field.selectionStart).toBe(17)
  })

  it('every insert stays visible: the row wraps in a narrow column', async () => {
    const { field, insert } = await mount()
    const group = field.parentElement!.querySelector<HTMLElement>('[data-scope="inserts"][data-part="root"]')!
    group.style.inlineSize = '90px'
    await wait(10)
    const a = insert('{{name}}').getBoundingClientRect()
    const b = insert('{{status}}').getBoundingClientRect()
    expect(b.top).toBeGreaterThan(a.top)
    expect(b.right).toBeLessThanOrEqual(group.getBoundingClientRect().right + 0.5)
  })
})
