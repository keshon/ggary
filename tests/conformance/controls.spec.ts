import { describe, expect, it, vi } from 'vitest'
import { setInputValue } from '../../packages/core/src/index'
import { type Adapter, type NumberFieldProps, type SegmentedControlProps, type SliderProps, click, freshTarget, part } from './harness'

const views = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table', disabled: true },
]

/** A pointer gesture as jsdom can express it: MouseEvent carries clientX and the modifier keys. */
const pointer = (target: Element, type: string, init: MouseEventInit = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, ...init }))

/**
 * A segmented control is native radios, so its keyboard is the browser's and is
 * not re-tested here; what is tested is that the radios really are there.
 */
export function segmentedControlConformance(adapter: Adapter) {
  describe('segmented control', () => {
    const setup = async (props: Partial<SegmentedControlProps> = {}, target = freshTarget()) => {
      const m = await adapter.segmentedControl({ items: views, label: 'View mode', ...props }, target)
      const root = () => part(m.root, 'segmented-control', 'root')!
      const items = () => [...m.root.querySelectorAll('[data-scope="segmented-control"][data-part="item"]')] as HTMLElement[]
      const inputs = () => [...m.root.querySelectorAll('[data-scope="segmented-control"][data-part="input"]')] as HTMLInputElement[]
      return { m, root, items, inputs }
    }

    it('is a radiogroup of native radios, named by its label', async () => {
      const { m, root, items, inputs } = await setup()
      expect(root().getAttribute('role')).toBe('radiogroup')
      expect(root().getAttribute('aria-label')).toBe('View mode')
      expect(items().map((item) => item.tagName)).toEqual(['LABEL', 'LABEL', 'LABEL'])
      expect(inputs().map((input) => input.type)).toEqual(['radio', 'radio', 'radio'])
      expect(items().map((item) => part(item, 'segmented-control', 'text')!.textContent?.trim())).toEqual(['List', 'Grid', 'Table'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('shares one name, and moves the choice and the state on a click', async () => {
      const onValueChange = vi.fn()
      const { items, inputs } = await setup({ defaultValue: 'list', name: 'view', onValueChange })
      expect(inputs().map((input) => input.name)).toEqual(['view', 'view', 'view'])
      expect(items()[0].dataset.state).toBe('checked')

      await adapter.act(() => click(items()[1]))
      expect(onValueChange).toHaveBeenLastCalledWith('grid')
      expect(inputs()[1].checked).toBe(true)
      expect(items()[1].dataset.state).toBe('checked')
      expect(items()[0].dataset.state).toBe('unchecked')
    })

    it('submits the chosen value under the group name', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const { items } = await setup({ name: 'view', defaultValue: 'list' }, form)
      expect(new FormData(form).get('view')).toBe('list')
      await adapter.act(() => click(items()[1]))
      expect(new FormData(form).get('view')).toBe('grid')
    })

    it('a disabled option cannot be chosen; a disabled control disables every option', async () => {
      const onValueChange = vi.fn()
      const { inputs, items } = await setup({ onValueChange })
      expect(inputs()[2].disabled).toBe(true)
      expect(items()[2].dataset.disabled).toBe('')
      await adapter.act(() => click(items()[2]))
      expect(onValueChange).not.toHaveBeenCalled()

      const off = await setup({ disabled: true })
      expect(off.inputs().every((input) => input.disabled)).toBe(true)
      expect(off.root().getAttribute('aria-disabled')).toBe('true')
      await off.m.update({ disabled: false })
      expect(off.inputs().map((input) => input.disabled)).toEqual([false, false, true])
    })

    it('carries its size and full width for the theme, and required for the group', async () => {
      const { m, root } = await setup({ required: true })
      expect(root().dataset.size).toBe('md')
      expect(root().getAttribute('aria-required')).toBe('true')
      await m.update({ size: 'sm', fullWidth: true })
      expect(root().dataset.size).toBe('sm')
      expect(root().dataset.fullWidth).toBe('')
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a value pushed by the owner', async () => {
      const { m, inputs } = await setup({ value: 'list', onValueChange: vi.fn() })
      await m.update({ value: 'table' })
      expect(inputs()[2].checked).toBe(true)
    })
  })
}

export function sliderConformance(adapter: Adapter) {
  describe('slider', () => {
    const setup = async (props: Partial<SliderProps> = {}, target = freshTarget()) => {
      const m = await adapter.slider({ label: 'Parallel agents', min: 0, max: 16, defaultValue: 4, ...props }, target)
      const root = () => part(m.root, 'slider', 'root')!
      const input = () => part(m.root, 'slider', 'input') as HTMLInputElement
      const output = () => part(m.root, 'slider', 'output') as HTMLOutputElement | null
      return { m, root, input, output }
    }

    it('is a native range input with its bounds, named by its label', async () => {
      const { m, root, input } = await setup({ step: 2, name: 'agents' })
      expect(input().type).toBe('range')
      expect([input().min, input().max, input().step]).toEqual(['0', '16', '2'])
      expect(input().name).toBe('agents')
      expect(input().getAttribute('aria-label')).toBe('Parallel agents')
      expect(root().dataset.size).toBe('md')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('hands the fill to the theme as a share of the track', async () => {
      const { m, root } = await setup({ defaultValue: 4 })
      expect(root().style.getPropertyValue('--slider-fill')).toBe('25%')
      await m.update({ value: 12 })
      expect(root().style.getPropertyValue('--slider-fill')).toBe('75%')
    })

    it('reports a number when it moves, and the fill follows', async () => {
      const onValueChange = vi.fn()
      const { root, input } = await setup({ onValueChange })
      await adapter.act(() => setInputValue(input(), '10'))
      expect(onValueChange).toHaveBeenLastCalledWith(10)
      expect(typeof onValueChange.mock.calls[0][0]).toBe('number')
      expect(root().style.getPropertyValue('--slider-fill')).toBe('62.5%')
    })

    it('shows the value in an output tied to the input, and hidden from assistive technology', async () => {
      const { m, input, output } = await setup({ showValue: true })
      expect(output()!.tagName).toBe('OUTPUT')
      expect(output()!.getAttribute('for')).toBe(input().id)
      expect(output()!.getAttribute('aria-hidden')).toBe('true')
      expect(output()!.textContent).toBe('4')
      await adapter.act(() => setInputValue(input(), '9'))
      expect(output()!.textContent).toBe('9')
      await m.update({ valueText: '9 agents' })
      expect(output()!.textContent).toBe('9 agents')
      expect(input().getAttribute('aria-valuetext')).toBe('9 agents')
    })

    it('says when it is unavailable, required or wrong', async () => {
      const { m, root, input } = await setup({ disabled: true, required: true })
      expect(input().disabled).toBe(true)
      expect(input().required).toBe(true)
      expect(root().dataset.disabled).toBe('')
      await m.update({ disabled: false, invalid: true })
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(root().dataset.invalid).toBe('')
    })

    it('inside a Field, the field names it: no aria-label of its own', async () => {
      const m = await adapter.field({ label: 'Confidence', hint: 'Below it the agent asks', slider: { min: 0, max: 100, defaultValue: 80 } }, freshTarget())
      const input = part(m.root, 'slider', 'input') as HTMLInputElement
      const label = part(m.root, 'field', 'label')!
      expect(input.hasAttribute('aria-label')).toBe(false)
      expect(label.getAttribute('for')).toBe(input.id)
      expect(input.getAttribute('aria-describedby')).toBe(part(m.root, 'field', 'hint')!.id)
      expect((part(m.root, 'slider', 'output') as HTMLOutputElement | null)?.getAttribute('for') ?? input.id).toBe(input.id)
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a value pushed by the owner', async () => {
      const { m, input } = await setup({ value: 4, onValueChange: vi.fn() })
      await m.update({ value: 14 })
      expect(input().value).toBe('14')
    })
  })
}

export function numberFieldConformance(adapter: Adapter) {
  describe('number field', () => {
    const setup = async (props: Partial<NumberFieldProps> = {}, target = freshTarget()) => {
      const m = await adapter.numberField({ label: 'Position X', axis: 'X', defaultValue: 128, ...props }, target)
      const root = () => part(m.root, 'number-field', 'root')!
      const axis = () => part(m.root, 'number-field', 'axis')!
      const input = () => part(m.root, 'number-field', 'input') as HTMLInputElement
      return { m, root, axis, input }
    }

    it('is a native number input behind an axis letter that names nothing', async () => {
      const { m, axis, input } = await setup({ step: 0.5, min: -10, max: 10, name: 'x' })
      expect(input().type).toBe('number')
      expect([input().min, input().max, input().step]).toEqual(['-10', '10', '0.5'])
      expect(input().name).toBe('x')
      expect(input().value).toBe('128')
      expect(input().getAttribute('aria-label')).toBe('Position X')
      expect(axis().textContent).toBe('X')
      // The letter is a handle, not a label: as a <label> it would become the whole name.
      expect(axis().tagName).not.toBe('LABEL')
      expect(axis().getAttribute('aria-hidden')).toBe('true')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('reports a number while it is typed into, and null when it is emptied', async () => {
      const onValueChange = vi.fn()
      const { input } = await setup({ onValueChange })
      await adapter.act(() => setInputValue(input(), '42'))
      expect(onValueChange).toHaveBeenLastCalledWith(42)
      await adapter.act(() => setInputValue(input(), ''))
      expect(onValueChange).toHaveBeenLastCalledWith(null)
    })

    it('drags the value from the axis letter: ten steps for twenty pixels, Shift ten times faster', async () => {
      const onValueChange = vi.fn()
      const { axis, input } = await setup({ step: 1, onValueChange })
      await adapter.act(() => {
        pointer(axis(), 'pointerdown', { clientX: 100 })
        pointer(axis(), 'pointermove', { clientX: 120 })
      })
      expect(input().value).toBe('138')
      expect(onValueChange).toHaveBeenLastCalledWith(138)

      await adapter.act(() => pointer(axis(), 'pointermove', { clientX: 120, shiftKey: true }))
      expect(input().value).toBe('228')

      const change = vi.fn()
      input().addEventListener('change', change)
      await adapter.act(() => pointer(axis(), 'pointerup', { clientX: 120 }))
      expect(change).toHaveBeenCalledTimes(1)
      // The drag is over: moving on changes nothing.
      await adapter.act(() => pointer(axis(), 'pointermove', { clientX: 200 }))
      expect(input().value).toBe('228')
    })

    it('a drag stays within the bounds, and does not start on a field that cannot change', async () => {
      const { axis, input } = await setup({ min: 0, max: 130, defaultValue: 128 })
      await adapter.act(() => {
        pointer(axis(), 'pointerdown', { clientX: 0 })
        pointer(axis(), 'pointermove', { clientX: 40 })
      })
      expect(input().value).toBe('130')

      const readOnly = await setup({ readOnly: true, defaultValue: 5 })
      expect(readOnly.input().readOnly).toBe(true)
      expect(readOnly.axis().hasAttribute('data-scrub')).toBe(false)
      await adapter.act(() => {
        pointer(readOnly.axis(), 'pointerdown', { clientX: 0 })
        pointer(readOnly.axis(), 'pointermove', { clientX: 40 })
      })
      expect(readOnly.input().value).toBe('5')
    })

    it('says when it is unavailable, required or wrong', async () => {
      const { m, root, input } = await setup({ disabled: true, required: true })
      expect(input().disabled).toBe(true)
      expect(input().required).toBe(true)
      expect(root().dataset.disabled).toBe('')
      await m.update({ disabled: false, invalid: true })
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(root().dataset.invalid).toBe('')
    })

    it('inside a Field, the field names it: no aria-label of its own', async () => {
      const m = await adapter.field({ label: 'Radius', error: 'Too large', invalid: true, numberField: { defaultValue: 45 } }, freshTarget())
      const input = part(m.root, 'number-field', 'input') as HTMLInputElement
      expect(input.hasAttribute('aria-label')).toBe(false)
      expect(part(m.root, 'field', 'label')!.getAttribute('for')).toBe(input.id)
      expect(input.getAttribute('aria-describedby')).toBe(part(m.root, 'field', 'error')!.id)
      expect(part(m.root, 'number-field', 'root')!.dataset.invalid).toBe('')
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a value pushed by the owner, including empty', async () => {
      const { m, input } = await setup({ value: 128, onValueChange: vi.fn() })
      await m.update({ value: 64 })
      expect(input().value).toBe('64')
      await m.update({ value: null })
      expect(input().value).toBe('')
    })
  })
}
