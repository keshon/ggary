import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DatePicker, TimePicker } from '../packages/react/src/index'

/**
 * The date picker where only a browser can say: the calendar under the field
 * in the top layer, real typing, the focus riding the keyboard across page
 * turns, the range drawn under a real pointer before the second press; two
 * months side by side, and the time picker's list under real typing.
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

async function mount(props: Record<string, unknown> = {}, component: typeof DatePicker | typeof TimePicker = DatePicker) {
  const clip = document.createElement('div')
  clip.style.cssText = 'overflow: hidden; block-size: 90px; inline-size: 420px; padding: 8px'
  const after = document.createElement('button')
  after.textContent = 'After'
  document.body.append(clip, after)
  root = createRoot(clip)
  root.render(createElement(component as typeof DatePicker, { label: 'Due', locale: 'en-GB', ...props }))
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

describe('two months', () => {
  it('stand side by side at one height, titles level, and the keyboard carries the focus from one grid to the other', async () => {
    const { trigger, content, day } = await mount({ mode: 'range', months: 2, defaultValue: { start: '2026-09-28', end: '2026-10-03' } })
    await userEvent.click(trigger)
    await frames(3)
    const months = [...content().querySelectorAll<HTMLElement>('[data-scope="calendar"][data-part="month"]')].map((month) => month.getBoundingClientRect())
    expect(months).toHaveLength(2)
    expect(months[1].left).toBeGreaterThan(months[0].right + 8)
    expect(Math.abs(months[1].top - months[0].top)).toBeLessThan(1)
    const titles = [...content().querySelectorAll<HTMLElement>('[data-scope="calendar"][data-part="title"]')].map((title) => title.getBoundingClientRect())
    expect(Math.abs(titles[1].top - titles[0].top)).toBeLessThan(1)
    // Each title centred over its own grid, with a button beside it or not.
    const grids = [...content().querySelectorAll<HTMLElement>('[data-scope="calendar"][data-part="grid"]')].map((grid) => grid.getBoundingClientRect())
    for (const i of [0, 1]) expect(Math.abs(titles[i].left + titles[i].width / 2 - (grids[i].left + grids[i].width / 2))).toBeLessThan(2)
    expect(document.activeElement).toBe(day('2026-09-28'))
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(day('2026-10-05'))
    expect(grids[1].left).toBeLessThanOrEqual(document.activeElement!.getBoundingClientRect().left)
  })
})

describe('time', () => {
  it('the list stands under the field at its width; typing walks it to the nearest time, in view, and Enter keeps what was typed', async () => {
    const { clip, input, control } = await mount({ label: 'Starts at', step: 15 }, TimePicker)
    await userEvent.click(input)
    await userEvent.keyboard('21:37')
    await frames(3)
    const list = clip.querySelector<HTMLElement>('[data-scope="time-picker"][data-part="content"]')!
    const box = list.getBoundingClientRect()
    const field = control.getBoundingClientRect()
    expect(box.top).toBeGreaterThanOrEqual(field.bottom)
    expect(Math.abs(box.width - field.width)).toBeLessThan(1)
    const highlighted = list.querySelector<HTMLElement>('[data-highlighted]')!
    expect(highlighted.textContent).toBe('21:30')
    const item = highlighted.getBoundingClientRect()
    expect(item.top).toBeGreaterThanOrEqual(box.top)
    expect(item.bottom).toBeLessThanOrEqual(box.bottom + 1)
    await userEvent.keyboard('{Enter}')
    await frames(2)
    expect(input.value).toBe('21:37')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens with its time in the middle of a list some rows tall, and the arrows scroll it no more than they must', async () => {
    const { clip, input } = await mount({ label: 'Starts at', defaultValue: '12:30' }, TimePicker)
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}')
    await frames(3)
    const list = clip.querySelector<HTMLElement>('[data-scope="time-picker"][data-part="content"]')!
    const box = list.getBoundingClientRect()
    expect(box.height).toBeLessThan(300)
    const centre = (el: Element) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 }
    const chosen = list.querySelector<HTMLElement>('[data-selected]')!
    expect(Math.abs(centre(chosen) - (box.top + box.height / 2))).toBeLessThan(20)
    const scrolled = list.scrollTop
    await userEvent.keyboard('{ArrowDown}')
    await frames(2)
    expect(list.scrollTop).toBe(scrolled)
  })

  it('with a date picker, the time sits in the same box on the same line, and the box is one field tall', async () => {
    const { clip, control } = await mount({ time: true, defaultValue: '2026-09-18T09:00' })
    const dayInput = control.querySelector<HTMLElement>('[data-scope="date-picker"][data-part="input"]')!.getBoundingClientRect()
    const timeInput = clip.querySelector<HTMLElement>('[data-scope="time-picker"][data-part="input"]')!.getBoundingClientRect()
    expect(timeInput.left).toBeGreaterThan(dayInput.right)
    expect(Math.abs(timeInput.top + timeInput.height / 2 - (dayInput.top + dayInput.height / 2))).toBeLessThan(1)
    const box = control.getBoundingClientRect()
    expect(box.height).toBeLessThan(44)
    expect(timeInput.right).toBeLessThanOrEqual(box.right)
  })
})
