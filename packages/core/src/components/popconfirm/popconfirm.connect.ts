import type { Dict, Normalizer } from '../../types'
import { popconfirmAnatomy } from './popconfirm.anatomy'
import type { PopconfirmEvent, PopconfirmState, PopconfirmWords } from './popconfirm.types'

export const popconfirmIds = (id: string) => ({
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  title: `${id}-title`,
  description: `${id}-description`,
  error: `${id}-error`,
})

export interface PopconfirmConnectOptions {
  /** The action destroys: the confirm is drawn so, and the focus lands on the safe answer. */
  destructive?: boolean
  /** Whether there is a description to point at. */
  description?: boolean
  words?: PopconfirmWords
}

export function connect<T = Dict>(
  state: PopconfirmState,
  send: (event: PopconfirmEvent) => void,
  normalize: Normalizer<T>,
  options: PopconfirmConnectOptions = {}
) {
  const { destructive = false, words = {} } = options
  const ids = popconfirmIds(state.id)
  const failed = state.error !== null
  const errorText = failed ? state.error || (words.failed ?? 'That did not work. Try again.') : ''
  const describedBy = [options.description ? ids.description : null, failed ? ids.error : null].filter(Boolean).join(' ') || undefined

  return {
    ids,
    open: state.open,
    placement: state.placement,
    pending: state.pending,
    failed,
    errorText,
    cancelText: words.cancel ?? 'Cancel',
    confirmText: words.confirm ?? 'Confirm',
    destructive,

    dismiss: (reason: 'escape' | 'outside') => send({ type: 'CLOSE', reason }),

    /** Behaviour and ARIA only, as Popover's: spread onto a Button. */
    triggerProps: normalize({
      id: ids.trigger,
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      onClick: () => send({ type: 'TOGGLE', reason: 'trigger' }),
    }),
    contentProps: normalize({
      ...popconfirmAnatomy.attrs('content'),
      id: ids.content,
      role: 'alertdialog',
      'aria-labelledby': ids.title,
      'aria-describedby': describedBy,
      tabIndex: -1,
      popover: 'manual',
      'data-state': state.open ? 'open' : 'closed',
    }),
    titleProps: normalize({ ...popconfirmAnatomy.attrs('title'), id: ids.title }),
    descriptionProps: normalize({ ...popconfirmAnatomy.attrs('description'), id: ids.description }),
    errorProps: normalize({ ...popconfirmAnatomy.attrs('error'), id: ids.error, role: 'alert' }),
    actionsProps: normalize({ ...popconfirmAnatomy.attrs('actions') }),
    /** Spread onto a Button at medium emphasis: a neutral way back. It takes the focus when the action destroys. */
    cancelProps: normalize({
      'data-answer': 'cancel',
      'data-autofocus': destructive ? '' : undefined,
      onClick: () => send({ type: 'CLOSE', reason: 'cancel' }),
    }),
    /** Spread onto a Button at high emphasis, `destructive` and `loading` as this api says. */
    confirmProps: normalize({
      'data-answer': 'confirm',
      'data-autofocus': destructive ? undefined : '',
      onClick: () => send({ type: 'CONFIRM' }),
    }),
  }
}
