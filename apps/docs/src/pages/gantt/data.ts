import { addDays } from '@ggary/core'

/** Days from the plan's own "now", a fixed Monday: the page draws the same chart whenever it is opened. */
const at = (days: number) => addDays('2026-01-12', days)

/** The rollout's phases; the kickoff, the rollout itself and the launch stand on their own. */
export const rolloutGroups = [
  { id: 'phase-prep', title: 'Preparation' },
  { id: 'phase-setup', title: 'Setup' },
  { id: 'phase-pilot', title: 'Pilot' },
]

/** A CRM rollout: Gantt's tasks. */
export const rolloutPlan = [
  { id: 'kickoff', title: 'Kickoff with sales', start: at(-21), end: at(-21), milestone: true, locked: true, owner: 'Aigul Safina' },
  { id: 'audit', title: 'Audit the old pipeline', start: at(-20), end: at(-12), progress: 1, locked: true, dependsOn: ['kickoff'], group: 'phase-prep', owner: 'Rustem Galiev' },
  { id: 'fields', title: 'Agree the deal fields', start: at(-11), end: at(-4), progress: 1, locked: true, dependsOn: ['audit'], group: 'phase-prep', owner: 'Aigul Safina' },
  { id: 'import', title: 'Import 700,000 leads', start: at(-3), end: at(6), progress: 0.55, dependsOn: ['fields'], group: 'phase-setup', owner: 'Innokentiy Sokolov' },
  { id: 'boards', title: 'Set up the boards', start: at(-2), end: at(9), progress: 0.2, dependsOn: ['fields'], group: 'phase-setup', owner: 'Rustem Galiev' },
  { id: 'training', title: 'Train the team', start: at(8), end: at(14), progress: 0, dependsOn: ['import'], group: 'phase-setup', owner: 'Aigul Safina' },
  { id: 'pilot', title: 'Pilot in Kazan', start: at(12), end: at(26), progress: 0, dependsOn: ['boards'], group: 'phase-pilot', owner: 'Innokentiy Sokolov' },
  { id: 'review', title: 'Review the pilot', start: at(27), end: at(27), milestone: true, dependsOn: ['pilot', 'training'], group: 'phase-pilot', owner: 'Aigul Safina' },
  { id: 'rollout', title: 'Roll out to every office', start: at(28), end: at(55), progress: 0, dependsOn: ['phase-pilot'], owner: 'Rustem Galiev' },
  { id: 'launch', title: 'Launch', start: at(56), end: at(56), milestone: true, dependsOn: ['rollout'], owner: 'Innokentiy Sokolov' },
]
export type RolloutTask = (typeof rolloutPlan)[number]

/** The same plan with the import started before the fields it waits for were agreed. */
export const lateStart = rolloutPlan.map((task) => (task.id === 'import' ? { ...task, start: at(-6) } : task))

/** Three weeks out of the middle: the bars that run past its edges are cut there. */
export const midRange = { start: at(-7), end: at(13) }

/** A save that never answers: a change stays on its way, for the page to show. */
export const hold = () => new Promise<void>(() => {})

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const press = async (host: HTMLElement, task: string, key: string) => {
  host.querySelector(`[data-scope="gantt"][data-part="schedule"][data-task="${task}"]`)?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await frame()
}

/**
 * A change made with the keyboard, as a person makes it: the import moved
 * three days on and kept, its save still out. (A change still being made is
 * kept by itself a moment after the last key, so it cannot be held on show.)
 */
export async function stageChange(host: HTMLElement) {
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'Enter']) await press(host, 'import', key)
}
