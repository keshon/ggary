import type { Crumb } from '@ggary/core/breadcrumbs'

/** The way to a run. The last crumb is the page itself, so it has no link. */
export const crumbs: Crumb[] = [
  { label: 'Projects', href: '#/breadcrumbs' },
  { label: 'worldgen', href: '#/breadcrumbs' },
  { label: 'Run #4127' },
]

/** The way to one file deep inside a run. */
export const deepCrumbs: Crumb[] = [
  { label: 'Projects', href: '#/breadcrumbs' },
  { label: 'worldgen', href: '#/breadcrumbs' },
  { label: 'Runs', href: '#/breadcrumbs' },
  { label: 'Run #4127', href: '#/breadcrumbs' },
  { label: 'Artifacts', href: '#/breadcrumbs' },
  { label: 'terrain-heightmap.png' },
]
