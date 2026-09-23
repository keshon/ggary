import type { Dict, Normalizer } from '../../types'
import { turnAnatomy } from './turn.anatomy'
import type { TurnProps, TurnWords } from './turn.types'

const WORDS: Required<TurnWords> = { tokens: 'tokens', seconds: 's', separator: ' · ' }

/** Under ten seconds a tenth is worth reading; above it, it is noise. */
const seconds = (value: number, locale: string | undefined) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)

/**
 * One step of an exchange. Everything else in the agent layer shows work; a
 * turn is what the work happens INSIDE — an answer is not a paragraph but a
 * container for steps, a diff, an approval, a failure.
 *
 * So it styles almost nothing and carries no role: who spoke is a name in the
 * head, which is where a screen reader gets it, and the turns of a thread are
 * siblings in a column the caller already has. The one thing core does compute
 * is the cost line, because "1,284 tokens · 4.1 s" is a formatting decision and
 * every adapter would otherwise make it again, differently.
 *
 * Only the person's turn is marked. A turn still arriving is `aria-busy` and
 * asks for the kit's Caret at the end of its body, rather than drawing one.
 */
export function connect<T = Dict>(props: TurnProps, normalize: Normalizer<T>, words: TurnWords = {}) {
  const { who, from = 'agent', time, tokens, duration, locale, streaming = false } = props
  const say = { ...WORDS, ...words }

  const parts: string[] = []
  if (Number.isFinite(tokens)) parts.push(`${new Intl.NumberFormat(locale).format(tokens as number)} ${say.tokens}`)
  if (Number.isFinite(duration)) parts.push(`${seconds(duration as number, locale)} ${say.seconds}`)

  return {
    who,
    /** The cost and the duration as one line, or nothing when neither was given. */
    cost: parts.length ? parts.join(say.separator) : undefined,
    /** Whether the adapter puts a Caret at the end of the body. */
    showCaret: streaming,
    rootProps: normalize({
      ...turnAnatomy.attrs('root'),
      // The machine's turn is the default and bare; see TurnFrom.
      'data-from': from === 'user' ? 'user' : undefined,
      'data-streaming': streaming ? '' : undefined,
      'aria-busy': streaming ? 'true' : undefined,
    }),
    headProps: normalize({ ...turnAnatomy.attrs('head') }),
    whoProps: normalize({ ...turnAnatomy.attrs('who') }),
    timeProps: normalize({ ...turnAnatomy.attrs('time') }),
    costProps: normalize({ ...turnAnatomy.attrs('cost') }),
    bodyProps: normalize({ ...turnAnatomy.attrs('body') }),
    /**
     * The row keeps its space whether or not the cursor is over it: hover may
     * strengthen a control, but a row that is not laid out at all does not
     * exist on a touchscreen, and one that appears moves the thread under the
     * reader.
     */
    actionsProps: normalize({ ...turnAnatomy.attrs('actions') }),
  }
}
