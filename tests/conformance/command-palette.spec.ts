import { describe, expect, it } from 'vitest'
import { type Adapter, type CommandPaletteProps, click, freshTarget, keydown, part, parts, typeInto } from './harness'
import { commands } from './commands'

/**
 * The palette in each framework: Ctrl+K from the page, the field that keeps
 * the focus and names the highlighted command, a level opened and left, a
 * command run after the palette has closed and the focus given back.
 */
export function commandPaletteConformance(adapter: Adapter) {
  const run = describe
  run('command palette', () => {
    const setup = async (props: Partial<CommandPaletteProps> = {}) => {
      const ran: string[] = []
      const before = document.createElement('button')
      before.textContent = 'Before'
      document.body.append(before)
      const m = await adapter.commandPalette({ commands, onRun: (command) => void ran.push(command.id), ...props }, freshTarget())
      const content = () => part(m.root, 'command-palette', 'content') as HTMLDialogElement
      const input = () => part(m.root, 'command-palette', 'input') as HTMLInputElement
      const texts = () => parts(m.root, 'command-palette', 'item').map((item) => item.firstElementChild!.firstChild!.textContent)
      const highlighted = () => document.getElementById(input().getAttribute('aria-activedescendant')!)?.firstElementChild?.firstChild?.textContent
      const press = (key: string, init: KeyboardEventInit = {}) =>
        adapter.act(() => void document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })))
      const open = async () => {
        before.focus()
        await adapter.act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true })))
        await adapter.wait(0)
      }
      return { m, before, content, input, texts, highlighted, press, open, ran }
    }

    it('Ctrl+K opens a modal dialog with the field focused, a combobox over a listbox of grouped commands', async () => {
      const { m, content, input, open } = await setup()
      expect(content().open).toBe(false)
      await open()
      expect(content().open).toBe(true)
      expect(content().getAttribute('aria-label')).toBe('Command palette')
      expect(document.activeElement).toBe(input())
      expect(input().getAttribute('role')).toBe('combobox')
      const list = part(m.root, 'command-palette', 'list')!
      expect(input().getAttribute('aria-controls')).toBe(list.id)
      expect(list.getAttribute('role')).toBe('listbox')
      const groups = parts(m.root, 'command-palette', 'group')
      expect(groups.map((group) => document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent)).toEqual(['Actions', 'Go to'])
      expect(parts(m.root, 'command-palette', 'item').every((item) => item.getAttribute('role') === 'option')).toBe(true)
      expect(part(m.root, 'command-palette', 'status')!.textContent).toBe('6 results')
    })

    it('typing narrows the list; the arrows move the highlight the field names, over a disabled command', async () => {
      const { input, texts, highlighted, press, open } = await setup()
      await open()
      expect(highlighted()).toBe('New deal')
      await press('ArrowDown')
      await press('ArrowDown')
      expect(highlighted()).toBe('Leads')
      await adapter.act(() => typeInto(input(), 'sett'))
      expect(texts()).toEqual(['Preferences'])
      expect(highlighted()).toBe('Preferences')
    })

    it('Enter runs the command after the palette has closed and given the focus back', async () => {
      const { before, content, press, open, ran } = await setup()
      await open()
      await press('ArrowDown')
      await press('ArrowDown')
      await press('Enter')
      await adapter.wait(10)
      expect(content().open).toBe(false)
      expect(ran).toEqual(['go-leads'])
      expect(document.activeElement).toBe(before)
    })

    it('a command with children opens its level; Backspace in the empty field goes back up, onto it', async () => {
      const { m, input, texts, highlighted, press, open, ran } = await setup()
      await open()
      await press('ArrowDown')
      await press('Enter')
      await adapter.wait(0)
      expect(texts()).toEqual(['New', 'In talks', 'Won'])
      expect(parts(m.root, 'command-palette', 'page').map((page) => page.textContent)).toEqual(['Move card'])
      expect(input().placeholder).toBe('Move to which column?')
      await press('Backspace')
      expect(texts()[1]).toBe('Move card')
      expect(highlighted()).toBe('Move card')
      expect(ran).toEqual([])
    })

    it('Escape goes up a level, then closes', async () => {
      const { content, texts, press, open } = await setup()
      await open()
      await press('ArrowDown')
      await press('Enter')
      await adapter.wait(0)
      await adapter.act(() => void keydown(document.activeElement!, 'Escape'))
      await adapter.wait(0)
      expect(content().open).toBe(true)
      expect(texts()[0]).toBe('New deal')
      await adapter.act(() => void keydown(document.activeElement!, 'Escape'))
      await adapter.wait(0)
      expect(content().open).toBe(false)
    })

    it('a press on a command runs it, and the field keeps the focus until then', async () => {
      const { m, open, ran } = await setup()
      await open()
      const reports = parts(m.root, 'command-palette', 'item').find((item) => item.textContent?.startsWith('Reports'))!
      const down = new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
      reports.dispatchEvent(down)
      expect(down.defaultPrevented).toBe(true)
      await adapter.act(() => click(reports))
      await adapter.wait(10)
      expect(ran).toEqual(['go-reports'])
    })
  })
}
