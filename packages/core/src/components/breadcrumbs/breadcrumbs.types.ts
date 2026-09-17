export interface Crumb {
  label: string
  /** Absent on the last crumb: a link to the page you are on is a false action. */
  href?: string
}

export interface BreadcrumbsProps {
  items: Crumb[]
  /**
   * The landmark's name. A screen has several navigations, and an unnamed one
   * cannot be told from the others in the landmark list.
   */
  label?: string
}
