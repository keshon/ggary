import { describe, expect, it, vi } from 'vitest'
import { setInputValue } from '../../packages/core/src/index'
import { type Adapter, type RangeSliderProps, freshTarget, part, parts } from './harness'

const euro = (n: number) => `€${n}`
const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))

/**
 * RangeSlider: a group named by its label, holding two native range inputs —
 * "Minimum" and "Maximum" — that meet but never cross. The range is said in
 * the header, in bubbles, or in two fields typed into and committed on Enter
 * or when left. Slider's marks are here too.
 */
export function rangeSliderConformance(adapter: Adapter) {
  describe('range slider', () => {
    const setup = async (props: Partial<RangeSliderProps> = {}, target = freshTarget()) => {
      const m = await adapter.rangeSlider({ label: 'Price', min: 0, max: 200, step: 5, defaultValue: [20, 80], formatValue: euro, ...props }, target)
      const root = () => part(m.root, 'range-slider', 'root')!
      const thumbs = () => parts(m.root, 'range-slider', 'thumb') as HTMLInputElement[]
      const fields = () => [...m.root.querySelectorAll<HTMLInputElement>("[data-scope='range-slider'][data-part='fields'] input")]
      return { m, root, thumbs, fields }
    }

    it('is a group named by its label, holding two sliders named for their ends', async () => {
      const { m, root, thumbs } = await setup()
      expect(root().getAttribute('role')).toBe('group')
      expect(root().getAttribute('aria-labelledby')).toBe(part(m.root, 'range-slider', 'label')!.id)
      expect(part(m.root, 'range-slider', 'label')!.textContent).toBe('Price')
      expect(thumbs().map((thumb) => [thumb.type, thumb.getAttribute('aria-label'), thumb.value, thumb.getAttribute('aria-valuetext')])).toEqual([
        ['range', 'Minimum', '20', '€20'],
        ['range', 'Maximum', '80', '€80'],
      ])
      expect(part(m.root, 'range-slider', 'value')!.textContent).toBe('€20 – €80')
      expect(root().style.getPropertyValue('--gg-range-start')).toBe('0.1')
      expect(root().style.getPropertyValue('--gg-range-end')).toBe('0.4')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('a thumb moved reports the range; pushed past the other, it stops against it', async () => {
      const onValueChange = vi.fn()
      const { root, thumbs } = await setup({ onValueChange })
      await adapter.act(() => setInputValue(thumbs()[1], '120'))
      expect(onValueChange).toHaveBeenLastCalledWith([20, 120])
      expect(root().style.getPropertyValue('--gg-range-end')).toBe('0.6')
      await adapter.act(() => setInputValue(thumbs()[0], '180'))
      expect(onValueChange).toHaveBeenLastCalledWith([120, 120])
      expect(thumbs()[0].value).toBe('120')
    })

    it('submits both ends, under one name or two', async () => {
      const form = freshTarget('form') as HTMLFormElement
      await setup({ name: ['price_min', 'price_max'] }, form)
      const data = new FormData(form)
      expect([data.get('price_min'), data.get('price_max')]).toEqual(['20', '80'])
      const other = freshTarget('form') as HTMLFormElement
      await setup({ name: 'price' }, other)
      expect(new FormData(other).getAll('price')).toEqual(['20', '80'])
    })

    it('with bubbles, each rides its thumb; close together, they share one', async () => {
      const { m } = await setup({ valueDisplay: 'bubbles' })
      expect(part(m.root, 'range-slider', 'value')).toBeNull()
      const bubbles = () => parts(m.root, 'range-slider', 'bubble').map((bubble) => [bubble.dataset.thumb, bubble.textContent])
      expect(bubbles()).toEqual([['start', '€20'], ['end', '€80']])
      expect(part(m.root, 'range-slider', 'bubbles')!.getAttribute('aria-hidden')).toBe('true')
      await m.update({ value: [60, 70] })
      expect(bubbles()).toEqual([['both', '€60 – €70']])
    })

    it('with inputs, a field named for its end is typed into and committed on Enter, kept on the step and its side', async () => {
      const onValueChange = vi.fn()
      const { m, fields, thumbs } = await setup({ valueDisplay: 'inputs', prefix: '€', onValueChange })
      expect(fields().map((field) => [field.type, field.getAttribute('aria-label'), field.value])).toEqual([
        ['number', 'Minimum', '20'],
        ['number', 'Maximum', '80'],
      ])
      expect(part(m.root, 'input-group', 'prefix')!.textContent).toBe('€')
      await adapter.act(() => setInputValue(fields()[0], '3'))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(fields()[0].value).toBe('3')
      await adapter.act(() => setInputValue(fields()[0], '33'))
      await adapter.act(() => void key(fields()[0], 'Enter'))
      expect(onValueChange).toHaveBeenLastCalledWith([35, 80])
      expect(fields()[0].value).toBe('35')
      expect(thumbs()[0].value).toBe('35')
      await adapter.act(() => setInputValue(fields()[1], '10'))
      await adapter.act(() => fields()[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
      await adapter.act(() => fields()[1].dispatchEvent(new FocusEvent('blur')))
      expect(onValueChange).toHaveBeenLastCalledWith([35, 35])
    })

    it('Escape in a field puts back what it had', async () => {
      const onValueChange = vi.fn()
      const { fields } = await setup({ valueDisplay: 'inputs', onValueChange })
      await adapter.act(() => setInputValue(fields()[1], '150'))
      await adapter.act(() => void key(fields()[1], 'Escape'))
      expect(fields()[1].value).toBe('80')
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('marks stand under the track in words, those in range drawn so, and are not read', async () => {
      const { m } = await setup({ marks: [0, 50, 100, 150, 200] })
      const marks = parts(m.root, 'range-slider', 'mark')
      expect(marks.map((mark) => mark.textContent)).toEqual(['€0', '€50', '€100', '€150', '€200'])
      expect(marks.map((mark) => mark.hasAttribute('data-in-range'))).toEqual([false, true, false, false, false])
      expect([marks[0].dataset.edge, marks[4].dataset.edge]).toEqual(['start', 'end'])
      expect(part(m.root, 'range-slider', 'marks')!.getAttribute('aria-hidden')).toBe('true')
    })

    it('a disabled range takes nothing', async () => {
      const { root, thumbs } = await setup({ disabled: true })
      expect(root().hasAttribute('data-disabled')).toBe(true)
      expect(thumbs().every((thumb) => thumb.disabled)).toBe(true)
    })
  })

  describe('slider marks', () => {
    it('stand under the track, in words, the ones passed drawn so', async () => {
      const m = await adapter.slider({ label: 'Parallel agents', min: 0, max: 16, defaultValue: 6, marks: [0, 8, 16], formatValue: (n) => `${n} agents` }, freshTarget())
      const marks = parts(m.root, 'slider', 'mark')
      expect(marks.map((mark) => mark.textContent)).toEqual(['0 agents', '8 agents', '16 agents'])
      expect(marks.map((mark) => mark.hasAttribute('data-passed'))).toEqual([true, false, false])
      expect(part(m.root, 'slider', 'marks')!.getAttribute('aria-hidden')).toBe('true')
    })
  })
}
