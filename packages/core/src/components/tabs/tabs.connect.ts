import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { tabsAnatomy } from './tabs.anatomy'
import type { TabItem, TabsEvent, TabsState, TabsVariant } from './tabs.types'

/** A value as an id fragment: any character outside [A-Za-z0-9_-] is spelled out. */
const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const tabsIds = (id: string) => ({
  root: id,
  list: `${id}-list`,
  tab: (value: string) => `${id}-tab-${idPart(value)}`,
  panel: (value: string) => `${id}-panel-${idPart(value)}`,
})

export interface TabsConnectOptions {
  /** The tab list's accessible name. */
  label?: string
  variant?: TabsVariant
  /** Whether panels are rendered. Without them the tabs are a switch, and point at nothing. Default true. */
  panels?: boolean
  /** The close button's accessible name, given the tab's label. */
  closeLabel?: (label: string) => string
}

/**
 * Tabs (WAI-ARIA APG): a tab list with one tab stop, and a panel per tab.
 *
 * A tab is a `div role="tab"`, not a button, so a closable tab can hold its
 * close button — a button inside a button is not valid HTML. The close button
 * is out of the tab order: Delete closes the focused tab, and a pointer uses
 * the button.
 */
export function connect<T = Dict>(
  state: TabsState,
  send: (event: TabsEvent) => void,
  normalize: Normalizer<T>,
  options: TabsConnectOptions = {}
) {
  const ids = tabsIds(state.id)
  const { variant = 'sections', panels = true, closeLabel = (label: string) => `Close ${label}` } = options
  const vertical = state.orientation === 'vertical'
  const selectedItem = state.items.find((item) => item.value === state.value) ?? null
  // The tab stop: the focused tab, or the selected one, or the first that exists.
  const stop = state.focus.value ?? state.value ?? state.items.find((item) => !item.disabled)?.value ?? null

  const onKeyDown = (item: TabItem) => (event: KeyboardEvent) => {
    const next = vertical ? 'ArrowDown' : 'ArrowRight'
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft'
    switch (event.key) {
      case next:
        event.preventDefault()
        send({ type: 'MOVE', step: 1 })
        return
      case previous:
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
      case 'Enter':
      case ' ':
        event.preventDefault()
        send({ type: 'ACTIVATE' })
        return
      case 'Delete':
        if (!item.closable) return
        event.preventDefault()
        send({ type: 'CLOSE', value: item.value })
        return
    }
  }

  return {
    ids,
    value: state.value,
    items: state.items,
    selectedItem,
    /** Watch this: when it changes, move real focus to the tab with `focusValue`. 0 means never. */
    focusNonce: state.focus.nonce,
    focusValue: state.focus.value,

    select: (value: string) => send({ type: 'SELECT', value }),
    close: (value: string) => send({ type: 'CLOSE', value }),

    rootProps: normalize({
      ...tabsAnatomy.attrs('root'),
      id: ids.root,
      'data-orientation': state.orientation,
      'data-variant': variant,
    }),

    listProps: normalize({
      ...tabsAnatomy.attrs('list'),
      id: ids.list,
      role: 'tablist',
      'aria-label': options.label,
      // Horizontal is a tablist's default; only the other one is said.
      'aria-orientation': vertical ? 'vertical' : undefined,
      'data-orientation': state.orientation,
      'data-variant': variant,
    }),

    getTabProps: (item: TabItem) => {
      const selected = item.value === state.value
      return normalize({
        ...tabsAnatomy.attrs('tab'),
        id: ids.tab(item.value),
        role: 'tab',
        'aria-selected': selected ? 'true' : 'false',
        'aria-controls': panels ? ids.panel(item.value) : undefined,
        'aria-disabled': item.disabled ? 'true' : undefined,
        tabIndex: item.value === stop ? 0 : -1,
        'data-value': item.value,
        'data-state': selected ? 'active' : 'inactive',
        'data-orientation': state.orientation,
        'data-disabled': item.disabled ? '' : undefined,
        'data-closable': item.closable ? '' : undefined,
        'data-modified': item.modified ? '' : undefined,
        onClick: () => {
          if (!item.disabled) send({ type: 'SELECT', value: item.value })
        },
        // A middle click closes a closable tab, as in every editor and browser.
        onAuxClick: (event: MouseEvent) => {
          if (event.button !== 1 || !item.closable) return
          event.preventDefault()
          send({ type: 'CLOSE', value: item.value })
        },
        onFocusIn: () => send({ type: 'FOCUS', value: item.value }),
        onKeyDown: onKeyDown(item),
      })
    },

    getTabTextProps: () => normalize({ ...tabsAnatomy.attrs('tab-text') }),

    getCloseProps: (item: TabItem) =>
      normalize({
        ...tabsAnatomy.attrs('close'),
        type: 'button',
        'aria-label': closeLabel(item.label),
        // Out of the tab order: one stop per tab list, and Delete closes from the keyboard.
        tabIndex: -1,
        onClick: (event: MouseEvent) => {
          // The tab's own click would select the tab that is closing.
          event.stopPropagation()
          send({ type: 'CLOSE', value: item.value })
        },
        // Pressing it must not move focus onto it, or into the tab.
        onPointerDown: (event: PointerEvent) => event.preventDefault(),
      }),

    closeIconProps: normalize({ ...tabsAnatomy.attrs('close-icon'), 'data-icon': 'close' satisfies IconName, 'aria-hidden': 'true' }),

    getPanelProps: (item: TabItem) => {
      const selected = item.value === state.value
      return normalize({
        ...tabsAnatomy.attrs('panel'),
        id: ids.panel(item.value),
        role: 'tabpanel',
        'aria-labelledby': ids.tab(item.value),
        // A panel with nothing focusable in it still has to be reachable (APG).
        tabIndex: 0,
        hidden: !selected,
        'data-state': selected ? 'active' : 'inactive',
        'data-value': item.value,
      })
    },
  }
}

export type TabsApi<T = Dict> = ReturnType<typeof connect<T>>
