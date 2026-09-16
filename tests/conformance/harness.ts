/**
 * The conformance harness.
 *
 * Every spec in this folder is written ONCE against this interface and runs
 * against every adapter. The interface hides the three things that genuinely
 * differ between frameworks — how a component is mounted, how new props reach
 * it, and when its effects have flushed — and nothing else. If a spec needs to
 * know which framework it is talking to, the spec is testing an adapter detail
 * rather than the kit's contract, and belongs in an adapter-specific file.
 *
 * Why this exists: every adapter bug found so far was DRIFT. The vanilla Select
 * forgot its empty state; the tab stop vanished only when items arrived late,
 * which only one adapter did. A suite that ran against one renderer could not see
 * either until someone went looking.
 */
import type { ChipGroupMode, ChipGroupOrientation, ChipItem } from '../../packages/core/src/components/chip-group'
import type { SelectItem } from '../../packages/core/src/components/select'
import type { ButtonEmphasis, ButtonSize, ButtonTone } from '../../packages/core/src/components/button'

export interface ButtonProps {
  label: string
  emphasis?: ButtonEmphasis
  tone?: ButtonTone
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
}

export interface SelectProps {
  items: SelectItem[]
  label?: string
  placeholder?: string
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  name?: string
  onValueChange?: (value: string | null, item: SelectItem | null) => void
}

export interface ChipGroupProps {
  items: ChipItem[]
  label?: string
  mode?: ChipGroupMode
  orientation?: ChipGroupOrientation
  removable?: boolean
  disabled?: boolean
  name?: string
  value?: string[]
  defaultValue?: string[]
  onSelectionChange?: (selection: string[], items: ChipItem[]) => void
  onRemove?: (value: string, item: ChipItem | null) => void
}

export interface Mounted<P> {
  /** The element the component was rendered into. Specs query inside it. */
  root: HTMLElement
  /** Push new props the way the framework would, and wait until they settle. */
  update(patch: Partial<P>): Promise<void>
  unmount(): Promise<void>
}

export interface Adapter {
  name: 'elements' | 'react' | 'svelte'

  /**
   * What the adapter's public API can express. A spec skips a case the adapter
   * cannot express — and says so in the test name — rather than faking it.
   * Custom elements have no controlled mode: an attribute cannot be owned by
   * the page and the element at once.
   */
  supports: { controlled: boolean }

  /** Run a user interaction and wait for everything it causes to flush. */
  act(interaction: () => void): Promise<void>

  button(props: ButtonProps, target: HTMLElement): Promise<Mounted<ButtonProps>>
  select(props: SelectProps, target: HTMLElement): Promise<Mounted<SelectProps>>
  chipGroup(props: ChipGroupProps, target: HTMLElement): Promise<Mounted<ChipGroupProps>>
}

// --- lifecycle -----------------------------------------------------------------

/**
 * Every mount is tracked and torn down after each test.
 *
 * Removing a component's DOM is not unmounting it. An open Select that is merely
 * detached keeps its document-level Escape and pointerdown listeners, and the NEXT
 * test's keypress drives the previous test's machine — which is exactly how the
 * first run of this suite produced React "not wrapped in act" warnings from a
 * select no test was looking at.
 */
const live = new Set<Mounted<any>>()

export function track<P>(mounted: Mounted<P>): Mounted<P> {
  const unmount = mounted.unmount
  const tracked: Mounted<P> = {
    ...mounted,
    async unmount() {
      if (!live.delete(tracked)) return
      await unmount()
    },
  }
  live.add(tracked)
  return tracked
}

export async function cleanup(): Promise<void> {
  for (const mounted of [...live]) await mounted.unmount()
  document.body.replaceChildren()
}

// --- helpers shared by the specs ---------------------------------------------

export const keydown = (target: Element, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

export const click = (target: Element) => (target as HTMLElement).click()

export const part = (root: ParentNode, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)

export const parts = (root: ParentNode, scope: string, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`),
]

/** A mount point for one test. Teardown is `cleanup`, run after each test. */
export function freshTarget(tag: 'div' | 'form' = 'div'): HTMLElement {
  const target = document.createElement(tag)
  document.body.append(target)
  return target
}
