import { createAnatomy } from '../../types'

export const budgetAnatomy = createAnatomy('budget', ['root', 'note'] as const)
export type BudgetPart = (typeof budgetAnatomy.parts)[number]
