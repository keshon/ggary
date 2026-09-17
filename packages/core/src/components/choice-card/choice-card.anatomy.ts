import { createAnatomy } from '../../types'

/**
 * A card IS the option's <label>, so a press anywhere on it lands in the
 * control. Only the frame and the words are the card's own parts: the box
 * inside is the checkbox's or the radio's, with their scope, so a theme draws
 * one mark and the card cannot drift from the plain toggles.
 */
export const choiceCardAnatomy = createAnatomy('choice-card', ['root', 'body', 'title', 'description'] as const)
export type ChoiceCardPart = (typeof choiceCardAnatomy.parts)[number]

export const choiceCardGroupAnatomy = createAnatomy('choice-card-group', ['root', 'label', 'list'] as const)
export type ChoiceCardGroupPart = (typeof choiceCardGroupAnatomy.parts)[number]
