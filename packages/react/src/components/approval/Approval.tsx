import { useId, type ReactNode } from 'react'
import { connect, type ApprovalDecision, type ApprovalProps as CoreApprovalProps, type ApprovalWords } from '@ggary/core/approval'
import { reactNormalizer } from '@ggary/core'
import { Button } from '../button'

export interface ApprovalProps extends Omit<CoreApprovalProps, 'id'> {
  /** The answer. Sending it, and moving the block into a decided state, are the owner's. */
  onDecide?: (decision: ApprovalDecision) => void
  /** A third way out beside the two answers — "always allow". It never replaces "deny". */
  actions?: ReactNode
  words?: ApprovalWords
}

/** A decision a human must make, standing in the flow of the conversation. */
export function Approval(props: ApprovalProps) {
  const { what, state, title, effects, decidedBy, decidedAt, live, onDecide, actions, words } = props
  const id = `gg-approval-${useId().replace(/:/g, '')}`
  const api = connect({ id, what, state, title, effects, decidedBy, decidedAt, live }, reactNormalizer, { onDecide, words })

  return (
    <div {...api.rootProps}>
      <div {...api.headProps}>
        <span {...api.iconProps} />
        <span {...api.titleProps}>{api.title}</span>
      </div>
      <div {...api.whatProps}>{api.what}</div>
      {api.effects.length > 0 && (
        <ul {...api.effectsProps}>
          {api.effects.map((effect) => (
            <li key={effect.text} {...api.getEffectProps(effect)}>
              {effect.text}
            </li>
          ))}
        </ul>
      )}
      {api.showActions ? (
        <div {...api.actionsProps}>
          <Button emphasis="high" size="sm" onClick={api.allow.onClick}>
            {api.allow.label}
          </Button>
          <Button size="sm" onClick={api.deny.onClick}>
            {api.deny.label}
          </Button>
          {actions}
        </div>
      ) : (
        <p {...api.verdictProps}>{api.verdict}</p>
      )}
    </div>
  )
}
