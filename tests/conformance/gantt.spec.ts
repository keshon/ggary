import { describe, expect, it } from 'vitest'
import { type Adapter, type GanttProps, freshTarget, keydown, part, parts } from './harness'
import { plan, planRange } from './plan'

/**
 * The Gantt in each framework: a grid of task rows, each title its row's
 * header and each schedule a cell that says the dates in words, bars placed
 * in days, one tab stop the arrows move, and Enter opening a task.
 */
export function ganttConformance(adapter: Adapter) {
  const run = adapter.gantt ? describe : describe.skip
  run('gantt', () => {
    const setup = async (props: Partial<GanttProps> = {}) => {
      const opened: string[] = []
      const m = await adapter.gantt!({ tasks: plan, range: planRange, locale: 'en-GB', onOpen: (task) => void opened.push(task.id), ...props }, freshTarget())
      const root = () => part(m.root, 'gantt', 'root') ?? m.root
      const schedule = (id: string) => m.root.querySelector<HTMLElement>(`[data-part="schedule"][data-task="${id}"]`)!
      const press = (key: string) => adapter.act(() => void keydown(document.activeElement!, key))
      return { m, root, schedule, press, opened }
    }

    it('is a named grid: a header row, then a row per task, its title the row header, its schedule in words', async () => {
      const { m, root, schedule } = await setup()
      expect(root().getAttribute('role')).toBe('grid')
      expect(root().getAttribute('aria-label')).toBe('Schedule')
      expect(root().getAttribute('aria-rowcount')).toBe('5')
      const rows = parts(m.root, 'gantt', 'row')
      expect(rows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3', '4', '5'])
      expect(parts(m.root, 'gantt', 'title').map((title) => [title.getAttribute('role'), title.textContent])).toEqual([
        ['rowheader', 'Write the brief'],
        ['rowheader', 'Design the flow'],
        ['rowheader', 'Review with the client'],
        ['rowheader', 'Build the import'],
      ])
      const design = schedule('design')
      expect(design.getAttribute('role')).toBe('gridcell')
      expect(part(design, 'gantt', 'schedule-text')!.textContent).toBe('10 Sept – 18 Sept 2026, 9 days, 40% done')
      expect(part(schedule('review'), 'gantt', 'schedule-text')!.textContent).toBe('Milestone, 21 Sept 2026')
      expect(part(m.root, 'gantt', 'scale')!.getAttribute('aria-label')).toBe('Schedule, 1 Sept – 15 Oct 2026')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('places the bars in days: where each starts and how many it spans, a milestone on its day', async () => {
      const { root, schedule } = await setup()
      expect(root().style.getPropertyValue('--gg-gantt-days')).toBe('45')
      const bar = part(schedule('design'), 'gantt', 'bar')!
      expect([bar.style.getPropertyValue('--gg-gantt-start'), bar.style.getPropertyValue('--gg-gantt-span')]).toEqual(['9', '9'])
      expect(bar.getAttribute('aria-hidden')).toBe('true')
      expect(part(schedule('brief'), 'gantt', 'bar')!.hasAttribute('data-done')).toBe(true)
      expect(part(schedule('review'), 'gantt', 'milestone')).not.toBeNull()
      const progress = part(bar, 'gantt', 'bar-progress')!
      expect(progress.style.getPropertyValue('--gg-progress')).toBe('0.4')
    })

    it('one tab stop; the arrows walk the tasks with the real focus, Enter opens one', async () => {
      const { m, schedule, press, opened } = await setup()
      expect(parts(m.root, 'gantt', 'schedule').filter((cell) => cell.tabIndex === 0)).toEqual([schedule('brief')])
      schedule('brief').focus()
      await adapter.act(() => {})
      await press('ArrowDown')
      expect(document.activeElement).toBe(schedule('design'))
      await press('End')
      expect(document.activeElement).toBe(schedule('build'))
      await press('ArrowUp')
      await press('Enter')
      expect(opened).toEqual(['review'])
      expect(schedule('review').tabIndex).toBe(0)
    })

    it('with onChange, the arrows move the focused bar and say where; Enter hands the change over, Escape puts one back', async () => {
      const changes: unknown[] = []
      const { m, schedule, press } = await setup({ onChange: (change) => void changes.push([change.task.id, change.to]) })
      const design = schedule('design')
      expect(document.getElementById(design.getAttribute('aria-describedby')!)!.textContent).toContain('Left and Right move the task')
      const bar = () => part(schedule('design'), 'gantt', 'bar')!
      expect(bar().hasAttribute('data-editable')).toBe(true)
      expect(parts(bar(), 'gantt', 'bar-end')).toHaveLength(1)
      design.focus()
      await adapter.act(() => {})
      await press('ArrowRight')
      await press('ArrowRight')
      expect(bar().style.getPropertyValue('--gg-gantt-start')).toBe('11')
      expect(bar().hasAttribute('data-drafting')).toBe(true)
      expect(part(m.root, 'gantt', 'live')!.textContent).toBe('Design the flow: 12 Sept – 20 Sept 2026')
      expect(part(design, 'gantt', 'schedule-text')!.textContent).toBe('12 Sept – 20 Sept 2026, 9 days, 40% done')
      await press('Enter')
      await adapter.wait(10)
      expect(changes).toEqual([['design', { start: '2026-09-12', end: '2026-09-20' }]])
      await adapter.act(() => void design.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true })))
      expect(bar().style.getPropertyValue('--gg-gantt-span')).toBe('10')
      await press('Escape')
      expect(bar().style.getPropertyValue('--gg-gantt-span')).toBe('9')
      expect(part(m.root, 'gantt', 'live')!.textContent).toBe('Design the flow put back: 12 Sept – 20 Sept 2026')
    })

    it('without onChange the bars stay put and say nothing of moving', async () => {
      const { schedule, press } = await setup()
      expect(schedule('design').hasAttribute('aria-describedby')).toBe(false)
      schedule('design').focus()
      await adapter.act(() => {})
      await press('ArrowRight')
      expect(part(schedule('design'), 'gantt', 'bar')!.style.getPropertyValue('--gg-gantt-start')).toBe('9')
    })

    it('draws an arrow for each dependency, hidden from a screen reader, which hears it in the schedule instead', async () => {
      const tasks = [plan[0], { ...plan[1], start: '2026-09-09', dependsOn: ['brief'] }, { ...plan[2], dependsOn: ['design'] }, plan[3]]
      const { m, schedule } = await setup({ tasks })
      const links = part(m.root, 'gantt', 'links')!
      expect(links.getAttribute('aria-hidden')).toBe('true')
      const arrows = parts(links, 'gantt', 'link')
      expect(arrows.map((link) => [link.getAttribute('data-from'), link.getAttribute('data-to'), link.hasAttribute('data-conflict')])).toEqual([
        ['brief', 'design', true],
        ['design', 'review', false],
      ])
      expect(parts(arrows[0], 'gantt', 'link-segment').map((segment) => segment.getAttribute('data-axis'))).toEqual(['x', 'y', 'x', 'y', 'x'])
      expect(parts(arrows[1], 'gantt', 'link-head')).toHaveLength(1)
      const first = part(arrows[0], 'gantt', 'link-segment')!
      expect(['--gg-gantt-x1', '--gg-gantt-x2', '--gg-gantt-x2-gap', '--gg-gantt-y1'].map((name) => first.style.getPropertyValue(name))).toEqual(['9', '9', '1', '0.5'])
      expect(part(schedule('design'), 'gantt', 'schedule-text')!.textContent).toBe('9 Sept – 18 Sept 2026, 10 days, 40% done, after Write the brief; starts before Write the brief ends')
      expect(part(schedule('review'), 'gantt', 'schedule-text')!.textContent).toBe('Milestone, 21 Sept 2026, after Design the flow')
      await m.update({ tasks: plan })
      expect(part(m.root, 'gantt', 'links')).toBeNull()
    })

    it('a new scale redraws the header in its own units', async () => {
      const { m, root } = await setup({ scale: 'week' })
      expect(root().getAttribute('data-scale')).toBe('week')
      const bottom = parts(m.root, 'gantt', 'scale-row')[1]
      // A week is named for its first day, even when the chart starts inside it.
      expect(parts(bottom, 'gantt', 'scale-cell').slice(0, 2).map((cell) => cell.textContent)).toEqual(['31 Aug', '7 Sept'])
      await m.update({ scale: 'month' })
      expect(root().getAttribute('data-scale')).toBe('month')
      expect(parts(parts(m.root, 'gantt', 'scale-row')[1], 'gantt', 'scale-cell').map((cell) => cell.textContent)).toEqual(['Sept', 'Oct'])
    })
  })
}
