import type { ReactNode } from 'react'
import { connect, type TurnProps as CoreTurnProps, type TurnWords } from '@ggary/core/turn'
import { reactNormalizer } from '@ggary/core'
import { Caret } from '../states'

export interface TurnProps extends CoreTurnProps {
  /** What was said. A turn still arriving gets the caret at the end of it. */
  children?: ReactNode
  /** Between the head and the body: the reasoning that came before the answer. */
  before?: ReactNode
  /** After the body: what the answer produced — steps, a diff, an approval, a failure. */
  after?: ReactNode
  /** Copy, retry, branch. The row keeps its space whether or not it is hovered. */
  actions?: ReactNode
  /** The units of the head, for another language. */
  words?: TurnWords
}

/** One step of an exchange: who spoke, what they said, and what it cost. */
export function Turn(props: TurnProps) {
  const { who, from, time, tokens, duration, locale, streaming, children, before, after, actions, words } = props
  const api = connect({ who, from, time, tokens, duration, locale, streaming }, reactNormalizer, words)

  return (
    <div {...api.rootProps}>
      <div {...api.headProps}>
        <span {...api.whoProps}>{api.who}</span>
        {time !== undefined && <span {...api.timeProps}>{time}</span>}
        {api.cost !== undefined && <span {...api.costProps}>{api.cost}</span>}
      </div>
      {before}
      {children !== undefined && (
        <div {...api.bodyProps}>
          {children}
          {api.showCaret && <Caret />}
        </div>
      )}
      {after}
      {actions !== undefined && <div {...api.actionsProps}>{actions}</div>}
    </div>
  )
}
