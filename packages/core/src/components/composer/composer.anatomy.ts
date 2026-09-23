import { createAnatomy } from '../../types'

/**
 * The frame, the row of controls inside it, and the one control that is the
 * composer's own. The FIELD is not a part: it is a Textarea, which brings its
 * own scope and hands its border outwards the way an input group's field does.
 */
export const composerAnatomy = createAnatomy('composer', ['root', 'bar', 'send', 'send-icon'] as const)
export type ComposerPart = (typeof composerAnatomy.parts)[number]
