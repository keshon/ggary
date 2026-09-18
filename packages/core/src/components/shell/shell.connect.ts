import type { Dict, Normalizer } from '../../types'
import { shellAnatomy as anatomy } from './shell.anatomy'
import type { ShellChangeReason, ShellEvent, ShellState } from './shell.types'

export const shellIds = (id: string) => ({
  root: id,
  aside: `${id}-aside`,
  main: `${id}-main`,
  toggle: `${id}-toggle`,
})

/**
 * The narrow-screen breakpoint, the one @media rule of the layout. The same
 * number stands in the structure layer's shell.css, where a query cannot read a
 * custom property; a contract test holds the two together.
 */
export const SHELL_NARROW = '(width < 60rem)'

export interface ShellConnectOptions {
  /** "Skip to content": the first thing a keyboard meets. */
  skipLabel?: string
  /** The drawer button's name. It says what it opens, and aria-expanded says whether. */
  toggleLabel?: string
  /** The side column's name, when it holds more than one navigation. */
  asideLabel?: string
}

/**
 * The application frame: a side column, a header, the work area and a status
 * strip, each scrolling on its own — the navigation does not go anywhere while
 * a table is read.
 *
 * The work area is the page's `main`, reachable in one keystroke from the skip
 * link. On a narrow screen the column becomes a bar or a drawer (`collapse`);
 * the drawer's behaviour — Escape, a press outside, the page behind made inert,
 * the focus going in and coming back — is utils/shell's `attachShellDrawer`.
 */
export function connect<T = Dict>(state: ShellState, send: (event: ShellEvent) => void, normalize: Normalizer<T>, options: ShellConnectOptions = {}) {
  const ids = shellIds(state.id)
  const drawer = state.collapse === 'drawer'
  const open = drawer && state.open
  const status = open ? 'open' : 'closed'

  return {
    ids,
    open,
    drawer,
    close: (reason: ShellChangeReason = 'api') => send({ type: 'CLOSE', reason }),
    skipLabel: options.skipLabel ?? 'Skip to content',

    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'data-collapse': state.collapse,
      'data-state': status,
    }),
    skipLinkProps: normalize({
      ...anatomy.attrs('skip-link'),
      href: `#${ids.main}`,
      onClick: (event: MouseEvent) => {
        // Move the focus as well as the view: a fragment link scrolls, but
        // some browsers leave the focus at the top of the page.
        const main = (event.currentTarget as HTMLElement).ownerDocument.getElementById(ids.main)
        if (!main) return
        event.preventDefault()
        main.focus()
      },
    }),
    asideProps: normalize({
      ...anatomy.attrs('aside'),
      id: ids.aside,
      'aria-label': options.asideLabel,
      'data-state': status,
      // A link followed from the drawer is a page left: the drawer goes with it.
      onClick: (event: MouseEvent) => {
        if (open && (event.target as Element | null)?.closest?.('a[href]')) send({ type: 'CLOSE', reason: 'navigate' })
      },
    }),
    brandProps: normalize({ ...anatomy.attrs('brand') }),
    headerProps: normalize({ ...anatomy.attrs('header') }),
    toggleProps: normalize({
      ...anatomy.attrs('toggle'),
      id: ids.toggle,
      type: 'button',
      'aria-label': options.toggleLabel ?? 'Navigation',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': ids.aside,
      // A bar needs no button; the drawer's is drawn only on a narrow screen.
      hidden: drawer ? undefined : true,
      onClick: () => send({ type: 'TOGGLE', reason: 'toggle' }),
    }),
    toggleIconProps: normalize({ ...anatomy.attrs('toggle-icon'), 'aria-hidden': 'true', 'data-icon': 'list' }),
    mainProps: normalize({
      ...anatomy.attrs('main'),
      id: ids.main,
      // The skip link's target: focusable from script, not a tab stop.
      tabIndex: -1,
    }),
    footerProps: normalize({ ...anatomy.attrs('footer') }),
  }
}

export type ShellApi<T = Dict> = ReturnType<typeof connect<T>>
