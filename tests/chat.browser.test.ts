import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Approval, Composer, Thinking, Turn } from '../packages/react/src/index'

/**
 * What only a browser can say about the conversation half of the agent layer:
 * a composer that is one line tall until something is typed into it, a send
 * that really goes from the keyboard, a row of actions that is laid out before
 * it is visible, and the one block entitled to stop the eye actually standing
 * out from the thread around it.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(node: ReturnType<typeof h>, width = 720) {
  await page.viewport(1000, 700)
  const host = document.createElement('div')
  host.style.cssText = `inline-size: ${width}px`
  document.body.append(host)
  root = createRoot(host)
  root.render(node)
  await wait(60)
  return host
}

const box = (host: HTMLElement, scope: string, part: string) =>
  host.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${part}"]`)!

describe('composer', () => {
  it('is one line tall when empty and grows with what is typed, to a cap', async () => {
    const host = await mount(h(Composer, { label: 'Describe a task', placeholder: 'Describe a task' }))
    const frame = box(host, 'composer', 'root')
    const field = box(host, 'textarea', 'root') as HTMLTextAreaElement
    const empty = frame.getBoundingClientRect().height
    // A form's textarea rests at two and a half controls; a composer must not.
    expect(empty).toBeLessThan(60)

    await userEvent.click(field)
    await userEvent.fill(field, 'one\ntwo\nthree\nfour')
    await wait(40)
    const grown = frame.getBoundingClientRect().height
    expect(grown).toBeGreaterThan(empty)

    await userEvent.fill(field, Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n'))
    await wait(40)
    const capped = frame.getBoundingClientRect().height
    // Eight controls of field, plus the frame's own edges and the bar's row.
    expect(capped).toBeLessThan(340)
    expect(field.scrollHeight).toBeGreaterThan(field.clientHeight)
  })

  it('the frame takes one border and the field none: the ring goes round the whole object', async () => {
    const host = await mount(h(Composer, { label: 'Ask' }))
    const frame = box(host, 'composer', 'root')
    const field = box(host, 'textarea', 'root') as HTMLTextAreaElement
    expect(getComputedStyle(field).borderTopWidth).toBe('0px')
    expect(getComputedStyle(frame).borderTopWidth).not.toBe('0px')

    await userEvent.click(field)
    await wait(20)
    expect(document.activeElement).toBe(field)
    expect(getComputedStyle(frame).outlineStyle).toBe('solid')
    expect(getComputedStyle(field).outlineStyle).toBe('none')
  })

  it('Enter sends and leaves no newline behind; Shift+Enter writes one', async () => {
    const onSend = vi.fn()
    const host = await mount(h(Composer, { label: 'Ask', onSend }))
    const field = box(host, 'textarea', 'root') as HTMLTextAreaElement
    await userEvent.click(field)
    await userEvent.type(field, 'Add a share bar')
    await userEvent.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('Add a share bar')
    expect(field.value).toBe('Add a share bar')

    onSend.mockClear()
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onSend).not.toHaveBeenCalled()
    expect(field.value).toBe('Add a share bar\n')
  })

  it('the send control sits with the last line of a grown field, not in the middle of it', async () => {
    const host = await mount(h(Composer, { label: 'Ask', defaultValue: 'one\ntwo\nthree\nfour\nfive' }))
    await wait(60)
    const frame = box(host, 'composer', 'root').getBoundingClientRect()
    const send = box(host, 'composer', 'send').getBoundingClientRect()
    expect(frame.bottom - send.bottom).toBeLessThan(frame.height / 3)
  })
})

describe('turn', () => {
  it('lays the actions row out before it is visible, and focus reveals it', async () => {
    const host = await mount(
      h(
        'div',
        null,
        h('div', { id: 'away', style: { blockSize: '200px' } }),
        h(Turn, { who: 'Agent', actions: h('button', { type: 'button' }, 'Copy') }, 'Added, and the legend now keys the tones.')
      )
    )
    // The pointer is left where an earlier test put it; park it clear of the turn.
    await userEvent.hover(host.querySelector('#away')!)
    await wait(200)
    const actions = box(host, 'turn', 'actions')
    const button = actions.querySelector('button')!
    // The row has height from the start: the thread must not jump by a row as the cursor travels it.
    expect(actions.getBoundingClientRect().height).toBeGreaterThan(0)
    expect(Number(getComputedStyle(button).opacity)).toBe(0)

    button.focus()
    await wait(200)
    // Nothing is ever clickable while invisible.
    expect(Number(getComputedStyle(button).opacity)).toBe(1)
  })

  it('recesses the person and leaves the machine on the page itself', async () => {
    const host = await mount(
      h(
        'div',
        null,
        h(Turn, { who: 'You', from: 'user' }, 'Add a share bar.'),
        h(Turn, { who: 'Agent' }, "I'll put it above the strip.")
      )
    )
    const [ask, answer] = host.querySelectorAll<HTMLElement>('[data-scope="turn"][data-part="root"]')
    expect(getComputedStyle(ask).backgroundColor).not.toBe(getComputedStyle(answer).backgroundColor)
    expect(getComputedStyle(answer).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })
})

describe('thinking', () => {
  it('takes no room in the flow while it is shut, and gives the reasoning when opened', async () => {
    const host = await mount(h(Thinking, { duration: 4 }, 'The strip answers when, the share answers how much.'))
    const shut = box(host, 'thinking', 'root').getBoundingClientRect().height
    expect(box(host, 'thinking', 'content').getBoundingClientRect().height).toBe(0)

    await userEvent.click(box(host, 'thinking', 'trigger'))
    await wait(40)
    expect(box(host, 'thinking', 'root').getBoundingClientRect().height).toBeGreaterThan(shut)
    expect(box(host, 'thinking', 'body').textContent).toContain('The strip answers when')
  })
})

describe('approval', () => {
  it('stops the eye: an accent edge no other block in the kit carries, and it comes off once answered', async () => {
    const host = await mount(
      h(Approval, {
        what: 'rm -rf build/',
        effects: [{ text: 'It will delete build/ entire' }, { text: 'Irreversible: nothing goes to a recycle bin', tone: 'error' as const }],
      })
    )
    const root = box(host, 'approval', 'root')
    const waiting = getComputedStyle(root).borderInlineStartColor
    const waitingWidth = getComputedStyle(root).borderInlineStartWidth
    expect(parseFloat(waitingWidth)).toBeGreaterThan(1)

    // The irreversible consequence is marked by SHAPE, not by colour alone.
    const marks = host.querySelectorAll<HTMLElement>('[data-scope="approval"][data-part="effect"]')
    expect(getComputedStyle(marks[0], '::before').borderTopLeftRadius).not.toBe('0px')
    expect(getComputedStyle(marks[1], '::before').borderTopLeftRadius).toBe('0px')

    root.setAttribute('data-state', 'approved')
    await wait(20)
    expect(getComputedStyle(root).borderInlineStartColor).not.toBe(waiting)
  })
})
