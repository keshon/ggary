import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { approvalAnatomy as anatomy } from './approval.anatomy'
import type { ApprovalDecision, ApprovalEffect, ApprovalProps, ApprovalWords } from './approval.types'

const WORDS: Required<ApprovalWords> = {
  title: 'Confirmation is required',
  effects: (count) => `It will touch ${count}`,
  allow: 'Allow',
  deny: 'Deny',
  verdict: (decision, by, at) => {
    const head = decision === 'approved' ? 'Allowed' : 'Denied'
    return [head, by && `by ${by}`, at && `at ${at}`].filter(Boolean).join(' ')
  },
}

export const approvalIds = (id: string) => ({ root: id, title: `${id}-title`, effects: `${id}-effects` })

export interface ApprovalConnectOptions {
  /** The answer. Sending it, and moving the block into a decided state, belong to the owner. */
  onDecide?: (decision: ApprovalDecision) => void
}

/**
 * The agent stops and asks permission. Everything else on a screen can be
 * scrolled past; this cannot, which makes it the one block in the kit entitled
 * to stop the eye.
 *
 * Not a Banner and not a Note: both are messages with nothing to answer, and a
 * banner with two buttons in its action slot would still be missing the two
 * parts that do the work — the enumerated consequences and the record that
 * stays behind. Not a Dialog either: a modal blocks everything else, and this
 * decision is part of the feed and may legitimately wait.
 *
 * The order is fixed and is the argument: what will be done, what it will
 * touch, and only then the answers. A request beginning with its buttons
 * demands an answer before it states the question.
 *
 * The two answers are labels and handlers rather than prop bags, so an adapter
 * renders them with the kit's own Button — "Allow" at high emphasis and first,
 * which is the one signal of which is the principal action.
 */
export function connect<T = Dict>(props: ApprovalProps, normalize: Normalizer<T>, options: ApprovalConnectOptions & { words?: ApprovalWords } = {}) {
  const { words = {} } = options
  const { id, what, state = 'pending', title, effects = [], decidedBy, decidedAt, live = 'polite' } = props
  const say = { ...WORDS, ...words }
  const ids = approvalIds(id)
  const pending = state === 'pending'

  return {
    ids,
    effects,
    title: title ?? say.title,
    what,
    /** The only state where the answers are shown. */
    showActions: pending,
    /** The record left behind, or nothing while the block is still waiting. */
    verdict: pending ? undefined : say.verdict(state, decidedBy, decidedAt),

    allow: { label: say.allow, onClick: () => options.onDecide?.('approved') },
    deny: { label: say.deny, onClick: () => options.onDecide?.('denied') },

    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      // A group named by its heading, or the block falls apart into unrelated
      // paragraphs. The live mode is an attribute beside it, not a role.
      role: 'group',
      'aria-labelledby': ids.title,
      'aria-live': pending && live !== 'off' ? live : undefined,
      'data-state': state,
    }),

    headProps: normalize({ ...anatomy.attrs('head') }),
    iconProps: normalize({ ...anatomy.attrs('icon'), 'data-icon': 'question' satisfies IconName, 'aria-hidden': 'true' }),
    titleProps: normalize({ ...anatomy.attrs('title'), id: ids.title }),
    whatProps: normalize({ ...anatomy.attrs('what') }),

    // The number of consequences is announced before they are read: a list of
    // one and a list of nine are answered differently.
    effectsProps: normalize({ ...anatomy.attrs('effects'), id: ids.effects, 'aria-label': effects.length ? say.effects(effects.length) : undefined }),
    getEffectProps: (effect: ApprovalEffect) => normalize({ ...anatomy.attrs('effect'), 'data-tone': effect.tone }),

    actionsProps: normalize({ ...anatomy.attrs('actions') }),
    verdictProps: normalize({ ...anatomy.attrs('verdict') }),
  }
}
