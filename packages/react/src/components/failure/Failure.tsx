import type { ReactNode } from 'react'
import { connect, type FailureProps as CoreFailureProps, type FailureWords } from '@ggary/core/failure'
import { reactNormalizer } from '@ggary/core'
import { Button } from '../button'

export interface FailureProps extends CoreFailureProps {
  /** Try again. Sending it, and moving the block into a resolved state, are the owner's. */
  onRetry?: () => void
  /** The other ways out beside the retry: skip the file, cancel the run. */
  actions?: ReactNode
  words?: FailureWords
}

/** A breakdown: what failed, why in words that can be acted on, and the way back. */
export function Failure(props: FailureProps) {
  const { title, code, reason, state, tried, resolvedAt, live, onRetry, actions, words } = props
  const api = connect({ title, code, reason, state, tried, resolvedAt, live }, reactNormalizer, { onRetry, words })

  return (
    <div {...api.rootProps}>
      <div {...api.headProps}>
        <span {...api.iconProps} />
        <span {...api.titleProps}>{api.title}</span>
      </div>
      <div {...api.reasonProps}>{api.reason}</div>
      {api.tried.length > 0 && (
        <ul {...api.triedProps}>
          {api.tried.map((attempt) => (
            <li key={attempt} {...api.attemptProps}>
              {attempt}
            </li>
          ))}
        </ul>
      )}
      {api.showActions ? (
        <div {...api.actionsProps}>
          <Button emphasis="high" size="sm" onClick={api.retry.onClick}>
            {api.retry.label}
          </Button>
          {actions}
        </div>
      ) : (
        <p {...api.verdictProps}>{api.verdict}</p>
      )}
    </div>
  )
}
