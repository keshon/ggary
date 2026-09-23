import { createAnatomy } from '../../types'

/**
 * Three of these are the component rather than its decoration: `what` (what
 * exactly will be done), `effects` (what it will touch) and `actions` (the two
 * answers). Without any one of them the block is a decorated "are you sure?".
 */
export const approvalAnatomy = createAnatomy('approval', ['root', 'head', 'icon', 'title', 'what', 'effects', 'effect', 'actions', 'verdict'] as const)
export type ApprovalPart = (typeof approvalAnatomy.parts)[number]
