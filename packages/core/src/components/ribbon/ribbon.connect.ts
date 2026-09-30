import type { Dict, Normalizer } from '../../types'
import { ribbonAnatomy } from './ribbon.anatomy'
import type { RibbonEvent, RibbonItem, RibbonState, RibbonVariant } from './ribbon.types'

/** A value as an id fragment: any character outside [A-Za-z0-9_-] is spelled out. */
const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const ribbonIds = (id: string) => ({
  root: id,
  tabList: `${id}-tabs`,
  tab: (value: string) => `${id}-tab-${idPart(value)}`,
  panel: (value: string) => `${id}-panel-${idPart(value)}`,
})

export interface RibbonConnectOptions {
  /** The tab row's accessible name. Without it the tabs are unnamed. */
  label?: string
  /** `strip` for one ruled band, `cards` for a card per group. Default `strip`. */
  variant?: RibbonVariant
}

/**
 * A ribbon (3ds Max): a tab list of panel sets, each panel a row of groups,
 * each group a `toolbar` over the tools the page put there.
 *
 * The tabs keep Tabs' behaviour — one tab stop, arrows move and choose,
 * wrapping, disabled tabs skipped — and each group keeps Toolbar's: one tab
 * stop per group, arrows between its tools via `attachToolbarKeys` in the
 * adapter. Text fields inside a group keep their own arrows.
 */
export function connect<T = Dict>(
  state: RibbonState,
  send: (event: RibbonEvent) => void,
  normalize: Normalizer<T>,
  options: RibbonConnectOptions = {}
) {
  const ids = ribbonIds(state.id)
  const { variant = 'strip' } = options
  const selectedItem = state.items.find((item) => item.value === state.value) ?? null
  // The tab stop: the focused tab, or the selected one, or the first that exists.
  const stop = state.focus.value ?? state.value ?? state.items.find((item) => !item.disabled)?.value ?? null

  const onKeyDown = () => (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        send({ type: 'MOVE', step: 1 })
        return
      case 'ArrowLeft':
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
        // Automatic activation already chose on arrival; Enter re-affirms
        // the focused tab for keyboards that expect it to do something.
        if (state.focus.value !== null && state.focus.value !== state.value) {
          event.preventDefault()
          send({ type: 'SELECT', value: state.focus.value })
        }
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

    rootProps: normalize({ ...ribbonAnatomy.attrs('root'), id: ids.root, 'data-variant': variant }),

    tabListProps: normalize({
      ...ribbonAnatomy.attrs('tab-list'),
      id: ids.tabList,
      role: 'tablist',
      'aria-label': options.label,
      'data-variant': variant,
    }),

    getTabProps: (item: RibbonItem) => {
      const selected = item.value === state.value
      return normalize({
        ...ribbonAnatomy.attrs('tab'),
        id: ids.tab(item.value),
        role: 'tab',
        'aria-selected': selected ? 'true' : 'false',
        'aria-controls': ids.panel(item.value),
        'aria-disabled': item.disabled ? 'true' : undefined,
        tabIndex: item.value === stop ? 0 : -1,
        'data-value': item.value,
        'data-state': selected ? 'active' : 'inactive',
        'data-disabled': item.disabled ? '' : undefined,
        onClick: () => {
          if (!item.disabled) send({ type: 'SELECT', value: item.value })
        },
        onFocusIn: () => send({ type: 'FOCUS', value: item.value }),
        onKeyDown: onKeyDown(),
      })
    },

    getTabTextProps: () => normalize({ ...ribbonAnatomy.attrs('tab-text') }),

    getPanelProps: (item: RibbonItem) => {
      const selected = item.value === state.value
      return normalize({
        ...ribbonAnatomy.attrs('panel'),
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

/**
 * One named group of tools inside a panel. A `toolbar` of its own: one tab
 * stop, arrows between its tools. The label is both the caption and the
 * toolbar's accessible name.
 */
export function connectGroup<T = Dict>(label: string, normalize: Normalizer<T>) {
  return {
    groupProps: normalize({ ...ribbonAnatomy.attrs('group'), role: 'toolbar', 'aria-label': label }),
    bodyProps: normalize({ ...ribbonAnatomy.attrs('group-body') }),
    labelProps: normalize({ ...ribbonAnatomy.attrs('group-label'), 'aria-hidden': 'true' }),
    label,
  }
}

/** A line between groups. */
export function connectSeparator<T = Dict>(normalize: Normalizer<T>) {
  return { separatorProps: normalize({ ...ribbonAnatomy.attrs('separator'), 'aria-hidden': 'true' }) }
}

/**
 * A stacked tool inside a group body: a layout box that stands its button's
 * icon over its label. The button stays the kit's own Button — same props,
 * same intent API — so a tool is never a second component to keep true. The
 * box itself is never focusable and never in the tab order: the toolbar keys
 * walk the buttons inside it as if it were not there.
 */
export function connectTool<T = Dict>(normalize: Normalizer<T>) {
  return { toolProps: normalize({ ...ribbonAnatomy.attrs('tool') }) }
}

export type RibbonApi<T = Dict> = ReturnType<typeof connect<T>>
export type RibbonGroupApi<T = Dict> = ReturnType<typeof connectGroup<T>>
