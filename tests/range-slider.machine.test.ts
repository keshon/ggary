import { describe, expect, it, vi } from 'vitest'
import { connect, placeEnd } from '../packages/core/src/components/range-slider'
import { connect as connectSlider, sliderMarks } from '../packages/core/src/components/slider'
import type { Dict } from '../packages/core/src/types'

/**
 * The range slider without a DOM: where an end may stand, the two ends never
 * crossing, the value in words or in bubbles that share one when they come
 * close, marks, and a number typed into a field committed only when it is done.
 */

const same = (props: Dict) => props
const bounds = { min: 0, max: 200, step: 5, minGap: 0 }
const euro = (n: number) => `€${n}`

describe('an end', () => {
  it('stands on the step and on the track', () => {
    expect(placeEnd([20, 80], 0, 23, bounds)).toEqual([25, 80])
    expect(placeEnd([20, 80], 0, -40, bounds)).toEqual([0, 80])
    expect(placeEnd([20, 80], 1, 999, bounds)).toEqual([20, 200])
    expect(placeEnd([0.2, 0.8], 1, 0.30000000000000004, { min: 0, max: 1, step: 0.1, minGap: 0 })).toEqual([0.2, 0.3])
  })

  it('meets the other end but never crosses it, and keeps the gap asked for', () => {
    expect(placeEnd([20, 80], 0, 150, bounds)).toEqual([80, 80])
    expect(placeEnd([20, 80], 1, 5, bounds)).toEqual([20, 20])
    expect(placeEnd([20, 80], 0, 150, { ...bounds, minGap: 10 })).toEqual([70, 80])
  })
})

describe('range slider', () => {
  const setup = (props: Partial<Parameters<typeof connect>[0]> = {}, drafts: [string | null, string | null] = [null, null]) => {
    const onValueChange = vi.fn()
    const onDraftChange = vi.fn()
    const api = connect({ id: 'r', label: 'Price', min: 0, max: 200, step: 5, value: [20, 80], ...props }, same, { onValueChange, formatValue: euro, drafts, onDraftChange })
    return { api, onValueChange, onDraftChange }
  }

  it('is a group named by its label, its thumbs two sliders named for their ends, each saying its value in words', () => {
    const { api } = setup({ name: ['price_min', 'price_max'] })
    expect(api.rootProps).toMatchObject({ role: 'group', 'aria-labelledby': 'r-label', style: { '--gg-range-start': 0.1, '--gg-range-end': 0.4 } })
    expect(api.getThumbProps(0)).toMatchObject({ type: 'range', min: 0, max: 200, step: 5, value: '20', name: 'price_min', 'aria-label': 'Minimum', 'aria-valuetext': '€20' })
    expect(api.getThumbProps(1)).toMatchObject({ value: '80', name: 'price_max', 'aria-label': 'Maximum', 'aria-valuetext': '€80' })
    expect(api.valueText).toBe('€20 – €80')
    expect(api.valueProps['aria-hidden']).toBe('true')
  })

  it('without a value it spans the track; a value given backwards or off the track is put right', () => {
    expect(setup({ value: undefined }).api.value).toEqual([0, 200])
    expect(setup({ value: [150, -10] }).api.value).toEqual([0, 150])
  })

  it('a thumb pushed past the other stops against it, and its input is told so', () => {
    const { api, onValueChange } = setup()
    const input = { value: '150' }
    ;(api.getThumbProps(0).onInput as (event: unknown) => void)({ currentTarget: input })
    expect(onValueChange).toHaveBeenCalledWith([80, 80])
    expect(input.value).toBe('80')
  })

  it('the lower thumb comes to the front once it is in the upper half, so two met at the top can be pulled apart', () => {
    expect(setup({ value: [200, 200] }).api.getThumbProps(0)['data-front']).toBe('')
    expect(setup({ value: [0, 0] }).api.getThumbProps(0)['data-front']).toBeUndefined()
  })

  it('bubbles ride their thumbs, and two thumbs close together share one', () => {
    expect(setup().api.bubbles).toEqual([{ which: 'start', text: '€20' }, { which: 'end', text: '€80' }])
    expect(setup({ value: [60, 75] }).api.bubbles).toEqual([{ which: 'both', text: '€60 – €75' }])
    expect(setup({ value: [60, 60] }).api.bubbles).toEqual([{ which: 'both', text: '€60' }])
  })

  it('a field shows what is typed until it is committed on Enter or when left, kept on the step and its side', () => {
    const typing = setup({}, ['23', null])
    expect(typing.api.fieldText(0)).toBe('23')
    expect(typing.api.fieldText(1)).toBe('80')
    const props = typing.api.getFieldProps(0) as Dict
    expect(props).toMatchObject({ type: 'number', 'aria-label': 'Minimum', min: 0, max: 200, step: 5 })
    ;(props.onKeyDown as (event: unknown) => void)({ key: 'Enter', currentTarget: { value: '23' } })
    expect(typing.onDraftChange).toHaveBeenCalledWith(0, null)
    expect(typing.onValueChange).toHaveBeenCalledWith([25, 80])
    const over = setup({}, [null, '500'])
    ;((over.api.getFieldProps(1) as Dict).onFocusOut as (event: unknown) => void)({ currentTarget: { value: '500' } })
    expect(over.onValueChange).toHaveBeenCalledWith([20, 200])
  })

  it('a field emptied, or given what is not a number, goes back; Escape puts the draft back', () => {
    const { api, onValueChange, onDraftChange } = setup({}, ['abc', null])
    ;((api.getFieldProps(0) as Dict).onFocusOut as (event: unknown) => void)({ currentTarget: { value: '' } })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(onDraftChange).toHaveBeenCalledWith(0, null)
    const escape = { key: 'Escape', preventDefault: vi.fn() }
    ;((api.getFieldProps(0) as Dict).onKeyDown as (event: unknown) => void)(escape)
    expect(escape.preventDefault).toHaveBeenCalled()
  })

  it('marks in range are drawn so, and the end marks stand inside the track', () => {
    const { api } = setup({ marks: [200, 0, 100, { value: 50, label: 'Budget' }, 300] })
    expect(api.marks.map((mark) => [mark.label, mark.edge])).toEqual([['€0', 'start'], ['Budget', undefined], ['€100', undefined], ['€200', 'end']])
    expect(api.getMarkProps(api.marks[1])).toMatchObject({ 'data-in-range': '', style: { '--gg-mark': 0.25 } })
    expect(api.getMarkProps(api.marks[2])['data-in-range']).toBeUndefined()
  })
})

describe('slider marks', () => {
  it('stand where their values are, in order, with their words; a mark already passed is drawn so', () => {
    expect(sliderMarks([16, 0, 8], 0, 16).map((mark) => [mark.value, mark.at])).toEqual([[0, 0], [8, 0.5], [16, 1]])
    const api = connectSlider({ id: 's', value: 6, min: 0, max: 16, marks: [0, 4, 8] }, same, { formatValue: (n) => `${n} agents` })
    expect(api.marks.map((mark) => mark.label)).toEqual(['0 agents', '4 agents', '8 agents'])
    expect(api.getMarkProps(api.marks[1])).toMatchObject({ 'data-passed': '', style: { '--gg-mark': 0.25 } })
    expect(api.getMarkProps(api.marks[2])['data-passed']).toBeUndefined()
    expect(api.marksProps['aria-hidden']).toBe('true')
  })
})
