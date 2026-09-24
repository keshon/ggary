import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { thinkingAnatomy as anatomy } from './thinking.anatomy'
import type { ThinkingProps, ThinkingWords } from './thinking.types'

const WORDS: Required<ThinkingWords> = {
  thinking: 'Thinking…',
  thoughtFor: (duration) => `Thought for ${duration}`,
  thought: 'Thought',
  seconds: 's',
}

export const thinkingIds = (id: string) => ({ root: id, trigger: `${id}-trigger`, content: `${id}-content` })

/**
 * What the machine worked out before it answered. Collapsed by default: the
 * answer is what was asked for.
 *
 * NOT an Accordion item, and the kit's Accordion was read before this was
 * written. An Accordion promises three things this does not want: a `heading`
 * with a level, because a thought is an aside inside an answer and not a
 * section of the document; a `region` named by its button, which puts a
 * landmark in the page for every turn of a thread; and the arrow keys roving
 * between sibling sections, of which there are none — a thought stands alone
 * inside its turn. What is left of an Accordion for one item is its machine,
 * and `multiple`, `collapsible` and a roving focus are dead weight around one
 * boolean the adapter already holds.
 *
 * What it needs that an Accordion has no place for is the other half: the
 * summary text CHANGES while the reasoning arrives, and the region is
 * `aria-busy` until it stops. So: the Accordion's shape — a button with
 * `aria-expanded` owning a region by id, which is what makes a disclosure work
 * on the keyboard and in a screen reader — and none of its promises.
 *
 * NOT a Step either, for Instrument's reason: a step is a call with a result
 * that can fail, and nothing here can. It carries no tone and no dot.
 */
export function connect<T = Dict>(props: ThinkingProps, normalize: Normalizer<T>, options: { onToggle?: () => void; words?: ThinkingWords } = {}) {
  const { onToggle, words = {} } = options
  const { id, open = false, streaming = false, duration, locale, disabled = false } = props
  const say = { ...WORDS, ...words }
  const ids = thinkingIds(id)

  const label = streaming
    ? say.thinking
    : Number.isFinite(duration)
      ? say.thoughtFor(`${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(duration as number)} ${say.seconds}`)
      : say.thought

  const state = open ? 'open' : 'closed'

  return {
    ids,
    label,
    /** Whether the adapter puts a Caret at the end of the body. */
    showCaret: streaming,

    rootProps: normalize({ ...anatomy.attrs('root'), id: ids.root, 'data-state': state, 'data-streaming': streaming ? '' : undefined }),

    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      id: ids.trigger,
      type: 'button',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': ids.content,
      disabled: disabled || undefined,
      'data-state': state,
      onClick: () => {
        if (disabled) return
        onToggle?.()
      },
    }),

    /** The kit's one disclosure glyph, turned by the theme when the section opens. */
    indicatorProps: normalize({ ...anatomy.attrs('indicator'), 'data-icon': 'chevron-right' satisfies IconName, 'aria-hidden': 'true', 'data-state': state }),

    labelProps: normalize({ ...anatomy.attrs('label') }),

    contentProps: normalize({
      ...anatomy.attrs('content'),
      id: ids.content,
      role: 'group',
      'aria-labelledby': ids.trigger,
      // Reasoning that is still arriving is not announced as it lands: it is
      // the aside, and the answer beside it is what the reader is waiting for.
      'aria-busy': streaming ? 'true' : undefined,
      hidden: !open,
      'data-state': state,
    }),

    bodyProps: normalize({ ...anatomy.attrs('body') }),
  }
}
