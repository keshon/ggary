import type { IconName } from '@ggary/icons'
import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
import { edgeEnabled, nextEnabled } from '../../utils/collection'
import { syncOptions } from '../../utils/open-intent'

/**
 * Accordion (WAI-ARIA APG): a stack of headings, each a button that shows or
 * hides the section under it. One section at a time by default; `multiple`
 * lets several stand open, and `collapsible: false` keeps one always open.
 */

export interface AccordionItem {
  value: string
  label: string
  /** A line under the label, inside the button: its description, not part of its name. */
  description?: string
  disabled?: boolean
}

export interface AccordionOptions {
  /** Several sections may stand open. Default false. */
  multiple: boolean
  /** The open section may be closed, leaving none. Default true. */
  collapsible: boolean
  disabled: boolean
}

export interface AccordionState extends AccordionOptions {
  id: string
  items: AccordionItem[]
  /** The open sections. */
  value: string[]
  controlled: boolean
  /** The roving focus among the buttons; `nonce` moves real focus (Tabs' rule). */
  focus: { value: string | null; nonce: number }
  intent: { value: string[]; nonce: number }
}

export type AccordionEvent =
  | { type: 'TOGGLE'; value: string }
  /** The browser found text inside a closed section (`beforematch`): open it, whatever the rules. */
  | { type: 'REVEAL'; value: string }
  | { type: 'FOCUS'; value: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'SYNC_VALUE'; value: string[] }
  | { type: 'SYNC_ITEMS'; items: AccordionItem[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<AccordionOptions>)

export const accordionAnatomy = createAnatomy('accordion', ['root', 'item', 'heading', 'trigger', 'label', 'description', 'indicator', 'content', 'body'] as const)
export type AccordionPart = (typeof accordionAnatomy.parts)[number]

const DEFAULTS: AccordionOptions = { multiple: false, collapsible: true, disabled: false }

const isDisabled = (state: Pick<AccordionState, 'disabled'>, item: AccordionItem | undefined) => !item || state.disabled || !!item.disabled
const indexOf = (items: AccordionItem[], value: string | null) => (value == null ? -1 : items.findIndex((item) => item.value === value))
// Up and Down loop past the ends, as in the APG's example, and pass over a disabled section.
const walk = (state: AccordionState) => ({ loop: true, isDisabled: (item: AccordionItem) => isDisabled(state, item) })

function commit(state: AccordionState, value: string[]): AccordionState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

/** Whether a press on this open section would close it. */
export const canClose = (state: AccordionState, value: string) => state.multiple || state.collapsible || !state.value.includes(value)

export function reducer(state: AccordionState, event: AccordionEvent): AccordionState {
  switch (event.type) {
    case 'TOGGLE': {
      const item = state.items[indexOf(state.items, event.value)]
      if (isDisabled(state, item)) return state
      const open = state.value.includes(event.value)
      if (open) return canClose(state, event.value) ? commit(state, state.value.filter((value) => value !== event.value)) : state
      return commit(state, state.multiple ? [...state.value, event.value] : [event.value])
    }
    case 'REVEAL': {
      if (state.value.includes(event.value) || indexOf(state.items, event.value) === -1) return state
      return commit(state, state.multiple ? [...state.value, event.value] : [event.value])
    }
    case 'FOCUS':
      if (event.value === state.focus.value || indexOf(state.items, event.value) === -1) return state
      return { ...state, focus: { value: event.value, nonce: state.focus.nonce } }
    case 'MOVE': {
      const from = indexOf(state.items, state.focus.value)
      const next = nextEnabled(state.items, from, event.step, walk(state))
      if (next === -1 || next === from) return state
      return { ...state, focus: { value: state.items[next].value, nonce: state.focus.nonce + 1 } }
    }
    case 'EDGE': {
      const next = edgeEnabled(state.items, event.edge, walk(state))
      if (next === -1 || state.items[next].value === state.focus.value) return state
      return { ...state, focus: { value: state.items[next].value, nonce: state.focus.nonce + 1 } }
    }
    case 'SYNC_VALUE':
      return event.value.length === state.value.length && event.value.every((value, i) => value === state.value[i]) ? state : { ...state, value: event.value }
    case 'SYNC_ITEMS':
      return event.items === state.items ? state : { ...state, items: event.items }
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

export interface AccordionMachineConfig extends Partial<AccordionOptions> {
  id: string
  items?: AccordionItem[]
  /** Controlled: the open sections. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export function initialState(config: AccordionMachineConfig): AccordionState {
  const controlled = config.value !== undefined
  const value = (controlled ? config.value : config.defaultValue) ?? []
  return {
    id: config.id,
    items: config.items ?? [],
    value,
    controlled,
    multiple: config.multiple ?? DEFAULTS.multiple,
    collapsible: config.collapsible ?? DEFAULTS.collapsible,
    disabled: config.disabled ?? DEFAULTS.disabled,
    focus: { value: null, nonce: 0 },
    intent: { value, nonce: 0 },
  }
}

export function createAccordionMachine(config: AccordionMachineConfig): Machine<AccordionState, AccordionEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) config.onValueChange?.(next.intent.value)
  })
}

/** A value as an id fragment: any character outside [A-Za-z0-9_-] is spelled out. */
const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const accordionIds = (id: string) => ({
  root: id,
  trigger: (value: string) => `${id}-trigger-${idPart(value)}`,
  label: (value: string) => `${id}-label-${idPart(value)}`,
  description: (value: string) => `${id}-description-${idPart(value)}`,
  content: (value: string) => `${id}-content-${idPart(value)}`,
})

export interface AccordionConnectOptions {
  /** The heading level of each section's button. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * The APG's advice: a section is a `region` named by its button, unless there
 * are more than six — a page of landmarks is as hard to move through as none.
 */
const REGIONS_UP_TO = 6

export function connect<T = Dict>(state: AccordionState, send: (event: AccordionEvent) => void, normalize: Normalizer<T>, options: AccordionConnectOptions = {}) {
  const ids = accordionIds(state.id)
  const { headingLevel = 3 } = options
  const regions = state.items.length <= REGIONS_UP_TO
  // Every button is a tab stop (APG); the arrows are a shortcut, starting from the focused one.
  const isOpen = (value: string) => state.value.includes(value)

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        send({ type: 'MOVE', step: 1 })
        return
      case 'ArrowUp':
        event.preventDefault()
        send({ type: 'MOVE', step: -1 })
        return
      case 'Home':
        event.preventDefault()
        send({ type: 'EDGE', edge: 'first' })
        return
      case 'End':
        event.preventDefault()
        send({ type: 'EDGE', edge: 'last' })
        return
    }
  }

  return {
    ids,
    value: state.value,
    items: state.items,
    isOpen,
    focusNonce: state.focus.nonce,
    focusValue: state.focus.value,
    toggle: (value: string) => send({ type: 'TOGGLE', value }),
    reveal: (value: string) => send({ type: 'REVEAL', value }),

    rootProps: normalize({
      ...accordionAnatomy.attrs('root'),
      id: ids.root,
      'data-disabled': state.disabled ? '' : undefined,
    }),

    getItemProps: (item: AccordionItem) =>
      normalize({
        ...accordionAnatomy.attrs('item'),
        'data-value': item.value,
        'data-state': isOpen(item.value) ? 'open' : 'closed',
        'data-disabled': isDisabled(state, item) ? '' : undefined,
      }),

    headingProps: normalize({ ...accordionAnatomy.attrs('heading'), role: 'heading', 'aria-level': headingLevel }),

    getTriggerProps: (item: AccordionItem) => {
      const open = isOpen(item.value)
      const disabled = isDisabled(state, item)
      return normalize({
        ...accordionAnatomy.attrs('trigger'),
        id: ids.trigger(item.value),
        type: 'button',
        'aria-expanded': open ? 'true' : 'false',
        'aria-controls': ids.content(item.value),
        // Named by the label alone, described by the line under it: the text
        // run together would read "ShippingWhere and how fast".
        'aria-labelledby': ids.label(item.value),
        'aria-describedby': item.description ? ids.description(item.value) : undefined,
        // An open section that may not close says so (APG), and stays focusable.
        'aria-disabled': disabled || (open && !canClose(state, item.value)) ? 'true' : undefined,
        'data-state': open ? 'open' : 'closed',
        'data-disabled': disabled ? '' : undefined,
        onClick: () => send({ type: 'TOGGLE', value: item.value }),
        onFocusIn: () => send({ type: 'FOCUS', value: item.value }),
        onKeyDown,
      })
    },

    getLabelProps: (item: AccordionItem) => normalize({ ...accordionAnatomy.attrs('label'), id: ids.label(item.value) }),
    getDescriptionProps: (item: AccordionItem) => normalize({ ...accordionAnatomy.attrs('description'), id: ids.description(item.value) }),
    getIndicatorProps: (item: AccordionItem) =>
      normalize({
        ...accordionAnatomy.attrs('indicator'),
        'aria-hidden': 'true',
        'data-icon': 'chevron-down' satisfies IconName,
        'data-state': isOpen(item.value) ? 'open' : 'closed',
      }),

    getContentProps: (item: AccordionItem) => {
      const open = isOpen(item.value)
      return normalize({
        ...accordionAnatomy.attrs('content'),
        id: ids.content(item.value),
        role: regions ? 'region' : undefined,
        'aria-labelledby': regions ? ids.trigger(item.value) : undefined,
        // `findableContent` raises this to `until-found` where the browser can find in it.
        hidden: !open,
        'data-state': open ? 'open' : 'closed',
      })
    },

    bodyProps: normalize({ ...accordionAnatomy.attrs('body') }),
  }
}

export type AccordionApi<T = Dict> = ReturnType<typeof connect<T>>

/**
 * A closed section the browser's find-in-page still searches: `hidden` becomes
 * `hidden="until-found"`, and a match opens the section (`beforematch`). Where
 * the browser cannot, the section stays plainly hidden. Call it after every
 * render that may change `open`; it returns the listener's cleanup.
 */
export function findableContent(content: HTMLElement | null, open: boolean, onMatch: () => void): () => void {
  if (!content || !('onbeforematch' in content)) return () => {}
  if (!open && content.getAttribute('hidden') !== 'until-found') content.setAttribute('hidden', 'until-found')
  content.addEventListener('beforematch', onMatch)
  return () => content.removeEventListener('beforematch', onMatch)
}
