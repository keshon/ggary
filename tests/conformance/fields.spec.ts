import { describe, expect, it, vi } from 'vitest'
import { setInputValue } from '../../packages/core/src/index'
import {
  type Adapter,
  type ButtonGroupProps,
  type ChoiceCardGroupProps,
  type FileDropProps,
  type InputGroupProps,
  type SearchProps,
  click,
  freshTarget,
  part,
} from './harness'

const modes = [
  { value: 'parallel', title: 'In parallel', description: 'Up to 12 agents at once. More tokens, no guaranteed order.' },
  { value: 'sequential', title: 'Sequentially', description: 'One agent at a time. The log reads top to bottom.' },
  { value: 'manual', title: 'By hand', disabled: true },
]

/** A drop of files, as a browser sends one. */
const dropFiles = (zone: Element, files: File[]) => {
  const transfer = new DataTransfer()
  for (const file of files) transfer.items.add(file)
  zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }))
  zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
}

export function choiceCardsConformance(adapter: Adapter) {
  describe('choice cards', () => {
    const setup = async (props: Partial<ChoiceCardGroupProps> = {}, target = freshTarget()) => {
      const m = await adapter.choiceCards({ items: modes, label: 'Run mode', ...props }, target)
      const group = () => part(m.root, 'choice-card-group', 'root')!
      const cards = () => [...m.root.querySelectorAll('[data-scope="choice-card"][data-part="root"]')] as HTMLElement[]
      const inputs = () => [...m.root.querySelectorAll('input')] as HTMLInputElement[]
      return { m, group, cards, inputs }
    }

    it('is a radiogroup of labels, each a real radio with a heading and its consequences', async () => {
      const { m, group, cards, inputs } = await setup()
      expect(group().getAttribute('role')).toBe('radiogroup')
      expect(group().getAttribute('aria-labelledby')).toBe(part(m.root, 'choice-card-group', 'label')!.id)
      expect(cards().map((card) => card.tagName)).toEqual(['LABEL', 'LABEL', 'LABEL'])
      expect(inputs().map((input) => input.type)).toEqual(['radio', 'radio', 'radio'])
      expect(cards().map((card) => part(card, 'choice-card', 'title')!.textContent)).toEqual(['In parallel', 'Sequentially', 'By hand'])
      expect(part(cards()[0], 'choice-card', 'description')!.textContent).toBe(modes[0].description)
      // No description, no empty node to style around.
      expect(part(cards()[2], 'choice-card', 'description')).toBeNull()
      // The box is the plain control's, so one theme rule draws both.
      expect(part(cards()[0], 'radio', 'indicator')).not.toBeNull()
      // The words are inside the label: they ARE the option's name, so nothing overrides them.
      expect(inputs()[0].hasAttribute('aria-label')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('starts from defaultValue, and a press anywhere on a card chooses it', async () => {
      const onValueChange = vi.fn()
      const { cards, inputs } = await setup({ defaultValue: 'parallel', name: 'mode', onValueChange })
      expect(inputs()[0].checked).toBe(true)
      expect(cards()[0].dataset.state).toBe('checked')

      await adapter.act(() => click(cards()[1]))
      expect(onValueChange).toHaveBeenLastCalledWith('sequential')
      expect(inputs()[1].checked).toBe(true)
      expect(cards()[0].dataset.state).toBe('unchecked')
    })

    it('as checkboxes, it is a plain group and the value is every chosen one', async () => {
      const onValueChange = vi.fn()
      const { group, cards, inputs } = await setup({ type: 'checkbox', defaultValue: ['parallel'], onValueChange })
      expect(group().getAttribute('role')).toBe('group')
      expect(inputs().map((input) => input.type)).toEqual(['checkbox', 'checkbox', 'checkbox'])
      await adapter.act(() => click(cards()[1]))
      expect(onValueChange).toHaveBeenLastCalledWith(['parallel', 'sequential'])
      await adapter.act(() => click(cards()[0]))
      expect(onValueChange).toHaveBeenLastCalledWith(['sequential'])
    })

    it('submits the chosen value under the group name', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const { cards } = await setup({ name: 'mode', defaultValue: 'parallel' }, form)
      expect(new FormData(form).get('mode')).toBe('parallel')
      await adapter.act(() => click(cards()[1]))
      expect(new FormData(form).get('mode')).toBe('sequential')
    })

    it('a disabled option cannot be chosen, and says which one it is', async () => {
      const onValueChange = vi.fn()
      const { cards, inputs } = await setup({ onValueChange })
      expect(inputs()[2].disabled).toBe(true)
      expect(cards()[2].dataset.disabled).toBe('')
      await adapter.act(() => click(cards()[2]))
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('carries the group’s required, invalid and orientation', async () => {
      const { m, group } = await setup({ required: true, invalid: true })
      expect(group().getAttribute('aria-required')).toBe('true')
      expect(group().getAttribute('aria-invalid')).toBe('true')
      expect(part(m.root, 'choice-card-group', 'list')!.dataset.orientation).toBe('vertical')
      await m.update({ orientation: 'horizontal' })
      expect(part(m.root, 'choice-card-group', 'list')!.dataset.orientation).toBe('horizontal')
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a value pushed by the owner', async () => {
      const { m, inputs } = await setup({ value: 'parallel', onValueChange: vi.fn() })
      await m.update({ value: 'sequential' })
      expect(inputs()[1].checked).toBe(true)
    })
  })
}

export function searchConformance(adapter: Adapter) {
  describe('search', () => {
    const setup = async (props: Partial<SearchProps> = {}, target = freshTarget()) => {
      const m = await adapter.search({ label: 'Search the runs', ...props }, target)
      const root = () => part(m.root, 'search', 'root')!
      const input = () => part(m.root, 'input', 'root') as HTMLInputElement
      return { m, root, input }
    }

    it('is a native search field with a magnifier that names nothing', async () => {
      const { m, root, input } = await setup({ placeholder: 'worldgen', name: 'q' })
      expect(input().type).toBe('search')
      expect(input().name).toBe('q')
      expect(input().placeholder).toBe('worldgen')
      // A placeholder is not a label: it disappears on the first keystroke.
      expect(input().getAttribute('aria-label')).toBe('Search the runs')
      expect(part(m.root, 'search', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(m.root, 'search', 'icon')!.dataset.icon).toBe('search')
      expect(root().dataset.size).toBe('md')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('reports what is typed, and takes the field’s states', async () => {
      const onValueChange = vi.fn()
      const { m, input } = await setup({ onValueChange, defaultValue: 'world' })
      expect(input().value).toBe('world')
      await adapter.act(() => setInputValue(input(), 'worldgen'))
      expect(onValueChange).toHaveBeenLastCalledWith('worldgen')

      await m.update({ disabled: true })
      expect(input().disabled).toBe(true)
      await m.update({ disabled: false, invalid: true })
      expect(input().getAttribute('aria-invalid')).toBe('true')
    })

    it('inside a Field, the field names it: no aria-label of its own', async () => {
      const m = await adapter.field({ label: 'Search', hint: 'By name or id', search: {} }, freshTarget())
      const input = part(m.root, 'input', 'root') as HTMLInputElement
      expect(input.type).toBe('search')
      expect(input.hasAttribute('aria-label')).toBe(false)
      expect(part(m.root, 'field', 'label')!.getAttribute('for')).toBe(input.id)
      expect(input.getAttribute('aria-describedby')).toBe(part(m.root, 'field', 'hint')!.id)
    })
  })
}

export function inputGroupConformance(adapter: Adapter) {
  describe('input group', () => {
    const setup = async (props: Partial<InputGroupProps> = {}, target = freshTarget()) => {
      const m = await adapter.inputGroup({ prefix: '$', suffix: 'per hour', ...props }, target)
      const root = () => part(m.root, 'input-group', 'root')!
      return { m, root }
    }

    it('puts the affixes around the field, in reading order', async () => {
      const { m, root } = await setup()
      expect(part(m.root, 'input-group', 'prefix')!.textContent).toBe('$')
      expect(part(m.root, 'input-group', 'suffix')!.textContent).toBe('per hour')
      // The field sits between them; one adapter wraps it, so order is the claim.
      const field = part(m.root, 'input', 'root')!
      const prefix = part(m.root, 'input-group', 'prefix')!
      const suffix = part(m.root, 'input-group', 'suffix')!
      expect(prefix.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(field.compareDocumentPosition(suffix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(root().dataset.size).toBe('md')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('leaves out an affix it was not given', async () => {
      const { m } = await setup({ suffix: undefined })
      expect(part(m.root, 'input-group', 'prefix')).not.toBeNull()
      expect(part(m.root, 'input-group', 'suffix')).toBeNull()
      await m.update({ prefix: '' })
      expect(part(m.root, 'input-group', 'prefix')).toBeNull()
    })

    it('carries the state the group draws with', async () => {
      const { m, root } = await setup()
      await m.update({ size: 'sm', disabled: true })
      expect(root().dataset.size).toBe('sm')
      expect(root().dataset.disabled).toBe('')
      await m.update({ disabled: false, invalid: true })
      expect(root().dataset.invalid).toBe('')
    })
  })
}

export function fileDropConformance(adapter: Adapter) {
  describe('file drop', () => {
    const setup = async (props: Partial<FileDropProps> = {}, target = freshTarget()) => {
      const m = await adapter.fileDrop({ label: 'Drag files in or choose them', hint: 'Up to 20 MB', ...props }, target)
      const root = () => part(m.root, 'file-drop', 'root')!
      const input = () => part(m.root, 'file-drop', 'input') as HTMLInputElement
      return { m, root, input }
    }

    it('is a label around a real file input, with the call to action inside it', async () => {
      const { m, root, input } = await setup({ name: 'import', accept: '.json,.csv', multiple: true })
      expect(root().tagName).toBe('LABEL')
      expect(input().type).toBe('file')
      expect(input().name).toBe('import')
      expect(input().accept).toBe('.json,.csv')
      expect(input().multiple).toBe(true)
      expect(part(m.root, 'file-drop', 'text')!.textContent).toBe('Drag files in or choose them')
      expect(part(m.root, 'file-drop', 'hint')!.textContent).toBe('Up to 20 MB')
      expect(part(m.root, 'file-drop', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    // jsdom has no DataTransfer, so a drop can only be staged in the browser run.
    const dropping = typeof DataTransfer === 'undefined' ? it.skip : it

    dropping('takes a drop, names what it took, and reports it as a choice', async () => {
      const onFilesChange = vi.fn()
      const { m, root, input } = await setup({ multiple: true, onFilesChange })
      const file = new File(['{}'], 'seeds.json', { type: 'application/json' })
      await adapter.act(() => dropFiles(root(), [file]))
      expect(onFilesChange).toHaveBeenCalledTimes(1)
      expect(onFilesChange.mock.calls[0][0].map((each: File) => each.name)).toEqual(['seeds.json'])
      // The input really holds it, so the form submits it.
      expect([...input().files!].map((each) => each.name)).toEqual(['seeds.json'])
      expect(part(m.root, 'file-drop', 'files')!.textContent).toBe('seeds.json')
    })

    dropping('a drag over the zone is drawn, and a disabled zone takes nothing', async () => {
      const { root } = await setup()
      const transfer = new DataTransfer()
      transfer.items.add(new File(['{}'], 'seeds.json'))
      await adapter.act(() => root().dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer })))
      expect(root().dataset.dragging).toBe('')
      await adapter.act(() => root().dispatchEvent(new DragEvent('dragleave', { bubbles: true, dataTransfer: transfer })))
      expect(root().hasAttribute('data-dragging')).toBe(false)

      const onFilesChange = vi.fn()
      const off = await setup({ disabled: true, onFilesChange })
      expect(off.input().disabled).toBe(true)
      expect(off.root().dataset.disabled).toBe('')
      await adapter.act(() => dropFiles(off.root(), [new File(['{}'], 'seeds.json')]))
      expect(onFilesChange).not.toHaveBeenCalled()
    })

    it('inside a Field, the field names and describes it', async () => {
      const m = await adapter.field({ label: 'Recipients', hint: '.csv only', fileDrop: { accept: '.csv' } }, freshTarget())
      const input = part(m.root, 'file-drop', 'input') as HTMLInputElement
      expect(part(m.root, 'field', 'label')!.getAttribute('for')).toBe(input.id)
      expect(input.getAttribute('aria-describedby')).toBe(part(m.root, 'field', 'hint')!.id)
    })
  })
}

export function buttonGroupConformance(adapter: Adapter) {
  describe('button group', () => {
    const setup = async (props: Partial<ButtonGroupProps> = {}, target = freshTarget()) => {
      const m = await adapter.buttonGroup({ ...props }, target)
      const root = () => part(m.root, 'button-group', 'root')!
      const buttons = () => [...m.root.querySelectorAll('[data-scope="button"][data-part="root"]')] as HTMLElement[]
      return { m, root, buttons }
    }

    it('holds ordinary buttons and adds no roles of its own', async () => {
      const { m, root, buttons } = await setup()
      expect(buttons().map((button) => button.textContent?.trim())).toEqual(['One', 'Two', 'Three'])
      // Unnamed, it is a layout: a nameless group announces nothing.
      expect(root().hasAttribute('role')).toBe(false)
      expect(root().dataset.size).toBe('md')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('every button keeps its own tab stop: these are separate actions, not one value', async () => {
      const { buttons } = await setup()
      expect(buttons().every((button) => !button.hasAttribute('tabindex'))).toBe(true)
      expect(buttons().some((button) => button.hasAttribute('aria-checked'))).toBe(false)
    })

    it('is named only when it is given a name, and says the size its corners follow', async () => {
      const { m, root } = await setup()
      await m.update({ label: 'Alignment', size: 'sm' })
      expect(root().getAttribute('role')).toBe('group')
      expect(root().getAttribute('aria-label')).toBe('Alignment')
      expect(root().dataset.size).toBe('sm')
    })
  })
}
