import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { failureAnatomy as anatomy } from './failure.anatomy'
import type { FailureProps, FailureWords } from './failure.types'

const WORDS: Required<FailureWords> = {
  reason: (reason, code) => `${reason} (${code})`,
  tried: (count) => `Already tried: ${count}`,
  retry: 'Retry',
  verdict: (state, at) => [state === 'resolved' ? 'Resolved' : 'Given up', at && `at ${at}`].filter(Boolean).join(' '),
}

export interface FailureConnectOptions {
  /** Try again. Sending it, and moving the block into a resolved state, belong to the owner. */
  onRetry?: () => void
}

/**
 * The agent could not do it. The block answers three questions in a row: what
 * did not work, what has already been tried, and what to do next.
 *
 * **Not the kit's Banner with a retry in its actions**, which is the first
 * thing this was measured against. A Banner is a message about a screen: a
 * tone, a title, a line of text and a slot the caller fills. Three of the five
 * things here have nowhere to live in it. The `tried` list would be freehand
 * markup inside the banner's text, so it would carry no part, no name and no
 * count, and the theme could not style it; the machine code would be a string
 * in a sentence rather than a plate that says "this is quoted"; and the
 * lifecycle — pending, then resolved or given up, the alert ground coming off
 * and a record staying — has no equivalent, because a banner that has served
 * its purpose is dismissed rather than kept. What would be left of the argument
 * for reuse is the coloured box, which is the part that matters least.
 *
 * It IS an approval's sibling, and it is built as one: the same frame, the same
 * quiet list, the same record line, the same pending-and-then-stepped-back
 * lifecycle. What differs is the content and the tone.
 *
 * A failure block with no way out is not a failure block — it is a Note in red,
 * and the kit has a Note. So the retry is always rendered while the block is
 * pending; where going on is impossible in principle, the action is "cancel the
 * run" and the words say so.
 */
export function connect<T = Dict>(props: FailureProps, normalize: Normalizer<T>, options: FailureConnectOptions = {}, words: FailureWords = {}) {
  const { title, code, reason, state = 'pending', tried = [], resolvedAt, live = 'alert' } = props
  const say = { ...WORDS, ...words }
  const pending = state === 'pending'

  return {
    title,
    tried,
    /** The reason and its machine code as one line. */
    reason: say.reason(reason, code),
    /** The only state where the way out is shown. */
    showActions: pending,
    verdict: pending ? undefined : say.verdict(state, resolvedAt),

    retry: { label: say.retry, onClick: () => options.onRetry?.() },

    rootProps: normalize({
      ...anatomy.attrs('root'),
      // Only while it is pending: a block that has stepped back is a record,
      // and a record that shouts on every render is a bug in the thread.
      role: pending && live === 'alert' ? 'alert' : undefined,
      'aria-live': pending && live === 'polite' ? 'polite' : undefined,
      'data-state': state,
    }),

    headProps: normalize({ ...anatomy.attrs('head') }),
    // The tone's own glyph: colour is never the only carrier, and a red ground
    // alone reports nothing under forced colours or to a screen reader.
    iconProps: normalize({ ...anatomy.attrs('icon'), 'data-icon': 'status-error' satisfies IconName, 'aria-hidden': 'true' }),
    titleProps: normalize({ ...anatomy.attrs('title') }),
    reasonProps: normalize({ ...anatomy.attrs('reason') }),

    triedProps: normalize({ ...anatomy.attrs('tried'), 'aria-label': tried.length ? say.tried(tried.length) : undefined }),
    attemptProps: normalize({ ...anatomy.attrs('attempt') }),

    actionsProps: normalize({ ...anatomy.attrs('actions') }),
    verdictProps: normalize({ ...anatomy.attrs('verdict') }),
  }
}
