import { createAnatomy } from '../../types'

/**
 * A nav around an ordered list. The separator is a pseudo-element in the theme,
 * never a character in the markup: it would be read aloud and copied with the path.
 */
export const breadcrumbsAnatomy = createAnatomy('breadcrumbs', ['root', 'list', 'item', 'link', 'current'] as const)
export type BreadcrumbsPart = (typeof breadcrumbsAnatomy.parts)[number]
