import type { AnchorItem } from '@ggary/core/anchor'

/** This page's own sections: the live anchor follows the reading down it. */
export const thisPage: AnchorItem[] = [
  { label: 'Variants', href: '#section-variants' },
  { label: 'States', href: '#section-states' },
  { label: 'Composition', href: '#section-composition' },
]

/** A guide's outline, one level of sections within. */
export const guide: AnchorItem[] = [
  { label: 'Install', href: '#install' },
  {
    label: 'Usage',
    href: '#usage',
    items: [
      { label: 'Props', href: '#props' },
      { label: 'Events', href: '#events' },
      { label: 'Styling', href: '#styling' },
    ],
  },
  { label: 'Accessibility', href: '#accessibility' },
  { label: 'Changelog', href: '#changelog' },
]
