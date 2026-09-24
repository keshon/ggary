import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { paletteAnatomy } from './command-palette.anatomy'
import type { PaletteCommand, PaletteEvent, PaletteGroup, PaletteState, PaletteWords } from './command-palette.types'
import { levelOf, visibleGroups } from './command-palette.machine'

export const PALETTE_WORDS: PaletteWords = {
  label: 'Command palette',
  placeholder: 'Type a command or search…',
  results: 'Results',
  empty: 'Nothing matches',
  loading: 'Searching…',
  failed: 'The search failed',
  count: (count) => (count === 1 ? '1 result' : `${count} results`),
  hintMove: 'to move',
  hintRun: 'to run',
  hintBack: 'to go back',
  hintClose: 'to close',
}

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const paletteIds = (id: string) => ({
  content: `${id}-content`,
  input: `${id}-input`,
  list: `${id}-list`,
  status: `${id}-status`,
  group: (index: number) => `${id}-group-${index}`,
  item: (command: string) => `${id}-item-${idPart(command)}`,
})

export function connect<T = Dict>(state: PaletteState, send: (event: PaletteEvent) => void, normalize: Normalizer<T>, options: { words?: Partial<PaletteWords> } = {}) {
  const { words = {} } = options
  const w = { ...PALETTE_WORDS, ...words }
  const ids = paletteIds(state.id)
  const groups = visibleGroups(state, w.results)
  const count = groups.reduce((sum, group) => sum + group.commands.length, 0)
  const pages = state.path.map((id, i) => levelOf(state.commands, state.path.slice(0, i)).find((command) => command.id === id)).filter((command): command is PaletteCommand => !!command)
  const page = pages[pages.length - 1]
  const loading = state.path.length === 0 && state.remote.status === 'loading'
  const failed = state.path.length === 0 && state.remote.status === 'error'
  const status = loading && count === 0 ? w.loading : failed && count === 0 ? w.failed : count === 0 ? w.empty : w.count(count)

  return {
    ids,
    words: w,
    open: state.open,
    groups,
    pages,
    query: state.query,
    highlighted: state.highlighted,
    status,
    loading,
    isEmpty: count === 0,
    show: () => send({ type: 'OPEN' }),
    close: () => send({ type: 'CLOSE' }),
    toggle: () => send({ type: 'TOGGLE' }),

    /** An opener of your own: a button in a toolbar that says its shortcut. Spread onto a Button; no data-scope of the palette's. */
    triggerProps: normalize({
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'aria-keyshortcuts': 'Control+K Meta+K',
      onClick: () => send({ type: 'TOGGLE' }),
    }),

    contentProps: normalize({
      ...paletteAnatomy.attrs('content'),
      id: ids.content,
      'aria-label': w.label,
      tabIndex: -1,
      'data-state': state.open ? 'open' : 'closed',
    }),
    controlProps: normalize({ ...paletteAnatomy.attrs('control') }),
    searchIconProps: normalize({ ...paletteAnatomy.attrs('search-icon'), 'aria-hidden': 'true', 'data-icon': 'search' satisfies IconName }),
    pageProps: normalize({ ...paletteAnatomy.attrs('page') }),
    inputProps: normalize({
      ...paletteAnatomy.attrs('input'),
      id: ids.input,
      type: 'text',
      role: 'combobox',
      autoComplete: 'off',
      spellCheck: false,
      'aria-expanded': 'true',
      'aria-controls': ids.list,
      'aria-autocomplete': 'list',
      'aria-activedescendant': state.highlighted ? ids.item(state.highlighted) : undefined,
      'aria-describedby': ids.status,
      'aria-label': page ? `${w.label}: ${pages.map((command) => command.label).join(' › ')}` : w.label,
      placeholder: page?.placeholder ?? w.placeholder,
      value: state.query,
      onInput: (event: Event) => send({ type: 'QUERY', text: (event.target as HTMLInputElement).value }),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.isComposing) return
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            send({ type: 'MOVE', step: 1 })
            return
          case 'ArrowUp':
            event.preventDefault()
            send({ type: 'MOVE', step: -1 })
            return
          case 'PageDown':
            event.preventDefault()
            send({ type: 'EDGE', edge: 'last' })
            return
          case 'PageUp':
            event.preventDefault()
            send({ type: 'EDGE', edge: 'first' })
            return
          case 'Enter':
            event.preventDefault()
            send({ type: 'CHOOSE' })
            return
          case 'Backspace': {
            const input = event.target as HTMLInputElement
            if (input.value === '' && state.path.length > 0) {
              event.preventDefault()
              send({ type: 'BACK' })
            }
            return
          }
        }
      },
    }),
    listProps: normalize({ ...paletteAnatomy.attrs('list'), id: ids.list, role: 'listbox', 'aria-label': page?.label ?? w.label }),
    getGroupProps: (group: PaletteGroup, index: number) =>
      normalize({ ...paletteAnatomy.attrs('group'), role: 'group', 'aria-labelledby': group.name ? ids.group(index) : undefined }),
    getGroupLabelProps: (_group: PaletteGroup, index: number) => normalize({ ...paletteAnatomy.attrs('group-label'), id: ids.group(index), role: 'presentation' }),
    getItemProps: (command: PaletteCommand) => {
      const highlighted = command.id === state.highlighted
      return normalize({
        ...paletteAnatomy.attrs('item'),
        id: ids.item(command.id),
        role: 'option',
        'aria-selected': highlighted ? 'true' : 'false',
        'aria-disabled': command.disabled ? 'true' : undefined,
        'data-highlighted': highlighted ? '' : undefined,
        'data-disabled': command.disabled ? '' : undefined,
        'data-branch': command.children ? '' : undefined,
        // The field keeps the focus: a press must not take it.
        onPointerDown: (event: PointerEvent) => event.preventDefault(),
        onPointerMove: () => {
          if (!highlighted && !command.disabled) send({ type: 'HIGHLIGHT', id: command.id })
        },
        onClick: () => send({ type: 'CHOOSE', id: command.id }),
      })
    },
    itemTextProps: normalize({ ...paletteAnatomy.attrs('item-text') }),
    itemDescriptionProps: normalize({ ...paletteAnatomy.attrs('item-description') }),
    itemShortcutProps: normalize({ ...paletteAnatomy.attrs('item-shortcut'), 'aria-hidden': 'true' }),
    itemBranchProps: normalize({ ...paletteAnatomy.attrs('item-branch'), 'aria-hidden': 'true', 'data-icon': 'chevron-right' satisfies IconName }),
    emptyProps: normalize({ ...paletteAnatomy.attrs('empty') }),
    statusProps: normalize({ ...paletteAnatomy.attrs('status'), id: ids.status, role: 'status', 'aria-live': 'polite' }),
    footerProps: normalize({ ...paletteAnatomy.attrs('footer'), 'aria-hidden': 'true' }),
    hintProps: normalize({ ...paletteAnatomy.attrs('hint') }),
    keyProps: normalize({ ...paletteAnatomy.attrs('key') }),
  }
}

export type PaletteApi<T = Dict> = ReturnType<typeof connect<T>>

/** Keep the highlighted command in view as the arrows move it. */
export function revealPaletteItem(list: HTMLElement | null, id: string | null): void {
  if (!list || !id) return
  const item = list.ownerDocument.getElementById(id)
  if (!item || !list.contains(item)) return
  const top = item.offsetTop
  const bottom = top + item.offsetHeight
  if (top < list.scrollTop) list.scrollTop = top
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
}
