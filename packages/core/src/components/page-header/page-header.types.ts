import type { HeadingLevel } from '../../utils/region'

export interface PageHeaderProps {
  id: string
  title: string
  description?: string
  /** The title's level. Default 1: a screen has one title, and this is it. */
  headingLevel?: HeadingLevel
}
