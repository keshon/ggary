import { describe, expect, it, vi } from 'vitest'
import type { ChipItem } from '../../packages/core/src/components/chip-group'
import { type Adapter, type ChipGroupProps, click, freshTarget, keydown, part, parts } from './harness'

const items: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs', disabled: true },
  { value: 'devops', label: 'DevOps' },
]

/** Roving tabindex, toolbar semantics, selection and removal — per adapter. */
export function chipGroupConformance(adapter: Adapter) {
  describe('chip group', () => {
    const setup = async (props: Partial<ChipGroupProps> = {}, target = freshTarget()) => {
      const m = await adapter.chipGroup({ items, label: 'Tags', mode: 'multi', removable: true, ...props }, target)
      const chips = () => parts(m.root, 'chip', 'root') as HTMLButtonElement[]
      return {
        m,
        chips,
        list: () => part(m.root, 'chip-group', 'list')!,
        key: (target: Element, k: string) => adapter.act(() => keydown(target, k)),
        click: (el: Element) => adapter.act(() => click(el)),
        focus: (el: HTMLElement) => adapter.act(() => el.focus()),
      }
    }

    describe('anatomy', () => {
      it('renders chips under the chip scope, so chip styles apply unchanged', async () => {
        const { chips, list } = await setup()
        expect(chips()).toHaveLength(items.length)
        expect(list().getAttribute('role')).toBe('toolbar')
        expect(list().getAttribute('aria-orientation')).toBe('horizontal')
      })

      it('puts the dismiss glyph on a child part, never on the tap target', async () => {
        const { chips } = await setup()
        const remove = part(chips()[0], 'chip', 'remove')!
        expect(remove.hasAttribute('data-icon')).toBe(false)
        const glyph = part(remove, 'chip', 'remove-icon')!
        expect(glyph.dataset.icon).toBe('close')
        expect(glyph.getAttribute('aria-hidden')).toBe('true')
      })

      it('renders the empty part for an empty list', async () => {
        const { m, chips } = await setup({ items: [] })
        expect(part(m.root, 'chip-group', 'empty')).toBeTruthy()
        expect(chips()).toHaveLength(0)
      })
    })

    describe('roving tabindex', () => {
      it('keeps exactly one chip in the tab order', async () => {
        const { chips } = await setup()
        const tabbable = chips().filter((c) => c.tabIndex === 0)
        expect(tabbable).toEqual([chips()[0]])
        expect(chips().slice(1).every((c) => c.tabIndex === -1)).toBe(true)
      })

      // Regression: items assigned after construction left NO chip tabbable.
      it('keeps a tab stop when items arrive after mount', async () => {
        const { m, chips } = await setup({ items: [] })
        await m.update({ items })
        expect(chips().filter((c) => c.tabIndex === 0)).toHaveLength(1)
      })

      it('does not steal focus on mount', async () => {
        const { chips } = await setup()
        expect(document.activeElement).not.toBe(chips()[0])
      })

      it('moves real DOM focus with the arrow keys, skipping disabled chips', async () => {
        const { chips, key, focus } = await setup()
        await focus(chips()[0])
        await key(chips()[0], 'ArrowRight')
        expect(document.activeElement).toBe(chips()[1])
        await key(chips()[1], 'ArrowRight')
        expect(document.activeElement).toBe(chips()[3])
      })

      it('wraps at both ends', async () => {
        const { chips, key, focus } = await setup()
        await focus(chips()[0])
        await key(chips()[0], 'ArrowLeft')
        expect(document.activeElement).toBe(chips()[3])
        await key(chips()[3], 'ArrowRight')
        expect(document.activeElement).toBe(chips()[0])
      })

      // Regression: the focus effect once re-ran on every render and dragged
      // focus back into the group from wherever the user had moved it.
      it('does not drag focus back when it re-renders for an unrelated reason', async () => {
        const { m, chips, key, focus } = await setup()
        const outside = document.createElement('button')
        document.body.append(outside)

        await focus(chips()[0])
        await key(chips()[0], 'ArrowRight')
        expect(document.activeElement).toBe(chips()[1])

        await adapter.act(() => outside.focus())
        await m.update({ items: [...items] })
        expect(document.activeElement).toBe(outside)
      })

      it('follows the orientation for which arrows are live', async () => {
        const { chips, key, focus } = await setup({ orientation: 'vertical' })
        await focus(chips()[0])
        await key(chips()[0], 'ArrowRight')
        expect(document.activeElement).toBe(chips()[0])
        await key(chips()[0], 'ArrowDown')
        expect(document.activeElement).toBe(chips()[1])
      })
    })

    describe('selection', () => {
      it('exposes state through aria-pressed and data-selected', async () => {
        const { chips, click } = await setup()
        await click(chips()[0])
        expect(chips()[0].getAttribute('aria-pressed')).toBe('true')
        expect(chips()[0].hasAttribute('data-selected')).toBe(true)
        expect(chips()[1].getAttribute('aria-pressed')).toBe('false')
      })

      it('reports the selection with its resolved items', async () => {
        const onSelectionChange = vi.fn()
        const { chips, click } = await setup({ onSelectionChange })
        await click(chips()[1])
        expect(onSelectionChange).toHaveBeenCalledWith(['code'], [expect.objectContaining(items[1])])
      })

      it('submits one hidden input per selected value', async () => {
        const form = freshTarget('form') as HTMLFormElement
        await setup({ name: 'tags', defaultValue: ['design', 'devops'] }, form)
        expect(new FormData(form).getAll('tags')).toEqual(['design', 'devops'])
      })
    })

    describe('removal', () => {
      it('reports removal on Delete without mutating items', async () => {
        const onRemove = vi.fn()
        const { chips, key, focus } = await setup({ onRemove })
        await focus(chips()[0])
        await key(chips()[0], 'Delete')
        expect(onRemove).toHaveBeenCalledWith('design', expect.objectContaining(items[0]))
        expect(chips()).toHaveLength(4)
      })

      it('removes from the dismiss affordance without also toggling selection', async () => {
        const onRemove = vi.fn()
        const onSelectionChange = vi.fn()
        const { chips, click } = await setup({ onRemove, onSelectionChange })
        await click(part(chips()[0], 'chip', 'remove')!)
        expect(onRemove).toHaveBeenCalledTimes(1)
        expect(onSelectionChange).not.toHaveBeenCalled()
      })

      it('advertises the keyboard shortcut on removable chips', async () => {
        const { chips } = await setup()
        expect(chips()[0].getAttribute('aria-keyshortcuts')).toBe('Delete')
      })

      it('lands focus on an enabled neighbour once the owner shrinks the list', async () => {
        const { m, chips, key, focus } = await setup()
        await focus(chips()[3])
        await key(chips()[3], 'Delete')
        await m.update({ items: items.filter((i) => i.value !== 'devops') })
        expect(chips()).toHaveLength(3)
        // Not chips()[2]: that is the disabled Docs chip, which cannot take focus.
        expect(document.activeElement).toBe(chips()[1])
      })
    })

    describe('disabled', () => {
      it('disables every chip when the group is disabled', async () => {
        const { chips } = await setup({ disabled: true })
        expect(chips().every((c) => c.disabled)).toBe(true)
      })
    })
  })
}
