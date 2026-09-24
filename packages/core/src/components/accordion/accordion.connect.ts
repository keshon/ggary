import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { accordionAnatomy } from './accordion.anatomy'
import type { AccordionConnectOptions, AccordionEvent, AccordionItem, AccordionState } from './accordion.types'
import { canClose, isDisabled } from './accordion.machine'

/** A value as an id fragment: any character outside [A-Za-z0-9_-] is spelled out. */
const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const accordionIds = (id: string) => ({
  root: id,
  trigger: (value: string) => `${id}-trigger-${idPart(value)}`,
  label: (value: string) => `${id}-label-${idPart(value)}`,
  description: (value: string) => `${id}-description-${idPart(value)}`,
  content: (value: string) => `${id}-content-${idPart(value)}`,
})

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
