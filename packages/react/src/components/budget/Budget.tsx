import type { HTMLAttributes } from 'react'
import { connect, type BudgetProps as CoreBudgetProps, type BudgetWords } from '@ggary/core/budget'
import { reactNormalizer } from '@ggary/core'
import { Meter } from '../meter'

export interface BudgetProps extends CoreBudgetProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The fixed text of the forecast. */
  words?: Partial<BudgetWords>
}

/**
 * Spending against an explicit ceiling, with the forecast of its exhaustion.
 * The bar is the kit's Meter; what is added is the forecast — and a budget
 * with no `rate` has none, which is to say it is a Meter.
 */
export function Budget({ value, max, label, rate, tone, size, locale, words, ...rest }: BudgetProps) {
  const api = connect({ value, max, label, rate, tone, size, locale }, reactNormalizer, words)
  return (
    <div {...rest} {...api.rootProps}>
      <Meter {...api.meterProps} />
      {/* Always in the DOM, empty or not: a live region that arrives with its
          own text is not announced. */}
      <span {...api.noteProps}>{api.note}</span>
    </div>
  )
}
