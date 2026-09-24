import { createAnatomy } from '../../types'

/**
 * A question on its trigger before an action happens: "Delete this lead?" An
 * alert dialog in the popover layer — the page stays live — with the question,
 * a line on what follows, and two answers. The safe answer takes the focus
 * when the action destroys, so a stray Enter cancels; a slow action shows
 * busy on its button and keeps the question open until it is done, and a
 * failure is said in the question rather than lost. The two answers are the
 * kit's Buttons and keep their own anatomy; `data-answer` says which is which.
 */
export const popconfirmAnatomy = createAnatomy('popconfirm', ['content', 'title', 'description', 'error', 'actions'] as const)
export type PopconfirmPart = (typeof popconfirmAnatomy.parts)[number]
