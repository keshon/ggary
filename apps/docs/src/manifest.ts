/**
 * The site's one list of pages. The navigation, the order of the pages and
 * the README's list of components are all read from it; a page is a folder
 * in src/pages with the same id, holding one demo per framework.
 *
 * A component that can be used on its own has a page of its own. Parts that
 * only work inside another (ListItem, Column) are shown on their parent's.
 */
export interface DocPage {
  /** The route and the folder: #/button, src/pages/button. */
  id: string
  title: string
}

export interface DocGroup {
  title: string
  pages: DocPage[]
}

export const MANIFEST: DocGroup[] = [
  { title: 'Actions', pages: [{ id: 'button', title: 'Button' }] },
  { title: 'Inputs', pages: [{ id: 'upload', title: 'Upload' }] },
  { title: 'Data', pages: [{ id: 'list', title: 'List' }] },
  { title: 'Display', pages: [{ id: 'badge', title: 'Badge' }] },
]

export const PAGES: DocPage[] = MANIFEST.flatMap((group) => group.pages)
