import type { PaletteCommand } from '@ggary/core/command-palette'

const page = (id: string, label: string, keywords: string[] = []): PaletteCommand => ({
  id: `page:${id}`,
  label,
  keywords,
  run: () => (location.hash = `#/${id}`),
})

/** The docs' own commands: every kind a palette holds — a group, a description, a shortcut, a level, a disabled one. */
export const commands: PaletteCommand[] = [
  { id: 'top', label: 'Back to the top', group: 'Actions', shortcut: 'Home', run: () => window.scrollTo({ top: 0 }) },
  {
    id: 'open',
    label: 'Open a component…',
    group: 'Actions',
    keywords: ['page', 'go'],
    placeholder: 'Which component?',
    children: [page('button', 'Button'), page('menu', 'Menu'), page('tabs', 'Tabs'), page('nav', 'Nav')],
  },
  { id: 'print', label: 'Print this page', group: 'Actions', description: 'Not in the docs: use the browser’s own', disabled: true },
  { ...page('chip', 'Chip', ['tag']), group: 'Go to' },
  { ...page('menubar', 'Menubar', ['file', 'application']), group: 'Go to' },
  { ...page('pagination', 'Pagination', ['pages']), group: 'Go to' },
]

const companies = ['Acme Robotics', 'Acorn Freight', 'Northwind Traders', 'Nordic Timber', 'Globex', 'Initech']

/** A pretend server: companies whose name has the query in it, after a moment. */
export function searchCompanies(query: string, signal: AbortSignal): Promise<PaletteCommand[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const found = companies.filter((name) => name.toLowerCase().includes(query.toLowerCase()))
      resolve(found.map((name) => ({ id: `lead:${name}`, label: name, description: 'Lead' })))
    }, 500)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}
