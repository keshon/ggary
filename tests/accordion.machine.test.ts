import { describe, expect, it } from 'vitest'
import { connect, createAccordionMachine } from '../packages/core/src/components/accordion'
import { connect as connectProgress, progressFraction } from '../packages/core/src/components/progress'
import { sections } from './conformance/files'

/** The accordion's rules, and the progress numbers, with no DOM. */

const same = (props: Record<string, unknown>) => props

const accordion = (config: Partial<Parameters<typeof createAccordionMachine>[0]> = {}) => {
  const changes: string[][] = []
  const machine = createAccordionMachine({ id: 'a', items: sections, onValueChange: (value) => changes.push(value), ...config })
  return { machine, changes, send: machine.send, value: () => machine.getState().value }
}

describe('accordion', () => {
  it('one section at a time: opening another closes the first; the open one closes on a press', () => {
    const { send, value, changes } = accordion()
    send({ type: 'TOGGLE', value: 'shipping' })
    send({ type: 'TOGGLE', value: 'returns' })
    expect(value()).toEqual(['returns'])
    send({ type: 'TOGGLE', value: 'returns' })
    expect(changes).toEqual([['shipping'], ['returns'], []])
  })

  it('multiple: each stands open on its own', () => {
    const { send, value } = accordion({ multiple: true })
    send({ type: 'TOGGLE', value: 'shipping' })
    send({ type: 'TOGGLE', value: 'payment' })
    send({ type: 'TOGGLE', value: 'shipping' })
    expect(value()).toEqual(['payment'])
  })

  it('not collapsible: the open section stays, and its button says it cannot be pressed', () => {
    const { machine, send, value } = accordion({ collapsible: false, defaultValue: ['shipping'] })
    send({ type: 'TOGGLE', value: 'shipping' })
    expect(value()).toEqual(['shipping'])
    const api = connect(machine.getState(), send, same)
    expect(api.getTriggerProps(sections[0])).toMatchObject({ 'aria-expanded': 'true', 'aria-disabled': 'true' })
    expect(api.getTriggerProps(sections[1])).toMatchObject({ 'aria-expanded': 'false', 'aria-disabled': undefined })
  })

  it('a disabled section does not open; the arrows pass over it and loop', () => {
    const { send, value, machine } = accordion()
    send({ type: 'TOGGLE', value: 'warranty' })
    expect(value()).toEqual([])
    send({ type: 'FOCUS', value: 'returns' })
    send({ type: 'MOVE', step: 1 })
    expect(machine.getState().focus.value).toBe('payment')
    send({ type: 'MOVE', step: 1 })
    expect(machine.getState().focus.value).toBe('shipping')
  })

  it('a match found by the browser opens its section', () => {
    const { send, value } = accordion({ collapsible: false, defaultValue: ['shipping'] })
    send({ type: 'REVEAL', value: 'payment' })
    expect(value()).toEqual(['payment'])
  })

  it('a section is a region named by its button, up to six of them', () => {
    const { machine, send } = accordion()
    const api = connect(machine.getState(), send, same, { headingLevel: 2 })
    expect(api.headingProps).toMatchObject({ role: 'heading', 'aria-level': 2 })
    expect(api.getContentProps(sections[0])).toMatchObject({ role: 'region', 'aria-labelledby': api.ids.trigger('shipping'), hidden: true })
    const many = createAccordionMachine({ id: 'b', items: Array.from({ length: 7 }, (_, i) => ({ value: `s${i}`, label: `S${i}` })) })
    const crowded = connect(many.getState(), many.send, same)
    expect(crowded.getContentProps({ value: 's0', label: 'S0' })).toMatchObject({ role: undefined })
  })
})

describe('progress', () => {
  it('is a fraction of its range, clamped; no value is indeterminate', () => {
    expect(progressFraction(25)).toBe(0.25)
    expect(progressFraction(150)).toBe(1)
    expect(progressFraction(3, 2, 6)).toBe(0.25)
    expect(progressFraction(null)).toBeNull()
    expect(progressFraction(5, 10, 10)).toBeNull()
  })

  it('says its value in the locale’s words, and nothing about an amount it does not know', () => {
    const api = connectProgress({ id: 'p', value: 42, label: 'Upload', locale: 'en-US' }, same)
    expect(api.trackProps).toMatchObject({ role: 'progressbar', 'aria-valuenow': 42, 'aria-valuetext': '42%', 'aria-labelledby': 'p-label', style: { '--gg-progress': 0.42 } })
    const ru = connectProgress({ id: 'p', value: 42, locale: 'ru' }, same)
    expect(ru.valueText).toMatch(/^42\s%$/)
    const busy = connectProgress({ id: 'p' }, same)
    expect(busy.trackProps).toMatchObject({ 'aria-valuenow': undefined, 'aria-valuetext': undefined, 'data-state': 'indeterminate' })
    const files = connectProgress({ id: 'p', value: 3, max: 8, valueText: (value) => `${value} of 8 files` }, same)
    expect(files.trackProps).toMatchObject({ 'aria-valuetext': '3 of 8 files' })
  })
})
