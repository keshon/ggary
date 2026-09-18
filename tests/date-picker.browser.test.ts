import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DatePicker } from '../packages/react/src/index'

/**
 * The date picker where only a browser can say: the calendar under the field
 * in the top layer, real typing, the focus riding the keyboard across page
 * turns, the range drawn under a real pointer before the second press.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

async function mount(props: Record<string, unknown> = {}) {
  const clip = document.createElement('div')
  clip.style.cssText = 'overflow: hidden; block-size: 90px; inline-size: 320px; padding: 8px'
  const after = document.createElement('button')
  after.textContent = 'After'
  document.body.append(clip, after)
  root = createRoot(clip)
  root.render(createElement(DatePicker, { label: 'Due', locale: 'en-GB', ...props }))
  while (!clip.querySelector('[data-part="input"]')) await frames(1)
  return {
    clip,
    after,
    input: clip.querySelector<HTMLInputElement>('[data-part="input"]')!,
    trigger: clip.querySelector<HTMLButtonElement>('[data-part="trigger"]')!,
    control: clip.querySelector<HTMLElement>('[data-part="control"]')!,
    content: () => clip.querySelector<HTMLElement>('[data-scope="date-picker"][data-part="content"]')!,
    day: (date: string) => clip.querySelector<HTMLElement>(`[data-part="day"][data-date="${date}"]`)!,
  }
}

describe('date picker', () => {
  it('the calendar stands under the field, over an ancestor that clips, on the chosen day', async () => {
    const { trigger, control, content, day } = await mount({ defaultValue: '2026-09-18' })
    await userEvent.click(trigger)
    await frames(3)
    const card = content().getBoundingClientRect()
    const field = control.getBoundingClientRect()
    expect(card.top).toBeGreaterThanOrEqual(field.bottom)
    expect(Math.abs(card.left - field.left)).toBeLessThan(1)
    expect(card.height).toBeGreaterThan(250)
    expect(document.elementFromPoint(card.left + card.width / 2, card.top + card.height - 20)?.closest('[data-scope="date-picker"]')).toBeTruthy()
    expect(document.activeElement).toBe(day('2026-09-18'))
  })

  it('the keyboard turns the pages and the focus goes along; Enter chooses and the field shows it', async () => {
    const chosen: unknown[] = []
    const { trigger, input, day } = await mount({ defaultValue: '2026-09-28', onValueChange: (value: unknown) => chosen.push(value) })
    await userEvent.click(trigger)
    await userEvent.keyboard('{ArrowDown}{PageDown}')
    expect(document.activeElement).toBe(day('2026-11-05'))
    await userEvent.keyboard('{Shift>}{PageUp}{/Shift}{Enter}')
    expect(chosen).toEqual([{ start: '2025-11-05', end: null }])
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('5 Nov 2025')
  })

  it('typing in the field and moving on chooses the day; Tab goes on as usual', async () => {
    const chosen: unknown[] = []
    const { input, after } = await mount({ onValueChange: (value: unknown) => chosen.push(value) })
    await userEvent.click(input)
    await userEvent.keyboard('18/09/2026{Tab}{Tab}')
    expect(chosen).toEqual([{ start: '2026-09-18', end: null }])
    expect(input.value).toBe('18 Sept 2026')
    expect(document.activeElement).toBe(after)
  })

  it('a range is drawn under the pointer before the second press', async () => {
    const { trigger, day } = await mount({ mode: 'range', defaultValue: { start: '2026-09-10', end: null } })
    await userEvent.click(trigger)
    await userEvent.click(day('2026-09-14'))
    await userEvent.hover(day('2026-09-19'))
    expect(day('2026-09-16').dataset.inRange).toBe('')
    expect(day('2026-09-16').dataset.preview).toBe('')
    // The band is a strip the disc's height through the middle of the cell.
    const band = getComputedStyle(day('2026-09-16'))
    expect(band.backgroundImage).toContain('linear-gradient')
    expect(band.backgroundSize).toBe('100% 30px')
    await userEvent.click(day('2026-09-19'))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
