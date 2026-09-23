import type { ChipItem } from '@ggary/core/chip-group'
import { addDays, todayISO, weekday } from '@ggary/core'
import type { PaletteCommand } from '@ggary/core/command-palette'
import { setMode, type Mode } from './theme'
import type { MenuEntry } from '@ggary/core/menu'
import type { MenubarMenu } from '@ggary/core/menubar'
import type { TabItem } from '@ggary/core/tabs'
import type { SelectItem } from '@ggary/core/select'

export const frameworks: SelectItem[] = [
  { value: 'vanilla', label: 'Vanilla JS' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular (disabled)', disabled: true },
  { value: 'qwik', label: 'Qwik' },
  { value: 'astro', label: 'Astro' },
  { value: 'lit', label: 'Lit' },
  { value: 'preact', label: 'Preact' },
  { value: 'alpine', label: 'Alpine' },
  { value: 'htmx', label: 'htmx' },
]

export const tags: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs' },
  { value: 'devops', label: 'DevOps' },
  { value: 'legacy', label: 'Legacy (disabled)', disabled: true },
  { value: 'research', label: 'Research' },
  { value: 'infra', label: 'Infra' },
]

export const targets = [
  { href: '/index.html', label: 'vanilla', id: 'vanilla' },
  { href: '/react.html', label: 'react', id: 'react' },
  { href: '/svelte.html', label: 'svelte', id: 'svelte' },
]

export const roles: SelectItem[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
]

/** Placeholder clauses, long enough to make a dialog body scroll. */
export const terms = [
  'Using the service. You may use the sandbox to try components. Nothing you type here leaves your browser.',
  'Accounts. There are none. Every page starts fresh, and closing the tab forgets everything.',
  'Content. Text you enter in a field stays in that field until you reload the page.',
  'Availability. The sandbox runs on your machine, so it is available exactly when your machine is.',
  'Changes. Components change as the kit grows. A demo that worked yesterday may look different today.',
  'Feedback. If a component misbehaves, the conformance suite is where the fix belongs.',
  'Themes. Switching theme or mode changes how things look, never what they do.',
  'Accessibility. Every component is expected to work with a keyboard and a screen reader.',
  'Limits. Some behaviour can only be checked in a real browser; the test suite says which.',
  'Keyboard. Tab moves through the dialog and never leaves it while it is open.',
  'Scrolling. The page behind a modal dialog does not scroll; the dialog body does, when it has to.',
  'Nesting. A select opened inside a dialog closes first, on the first Escape.',
  'Returning. Closing a dialog puts focus back on the button that opened it.',
  'Forms. A form with method="dialog" closes it and reports which button submitted it.',
  'Sizes. Small, medium and large dialogs share one layout and differ only in width.',
  'Motion. Opening fades and rises a little, unless the system asks for reduced motion.',
  'Contrast. The title, description and close button pass the theme contrast gates.',
  'Stacking. A dialog is in the top layer, above every z-index, and no ancestor can clip it.',
  'Ending. Close this dialog with Escape, the close button, a click outside, or Accept.',
]

/** What the Menu demo's toggles control. The owner holds it; the menu reports choices. */
export interface ViewState {
  grid: boolean
  rulers: boolean
  density: 'compact' | 'comfortable'
}

export const initialView: ViewState = { grid: true, rulers: false, density: 'comfortable' }

export const documentMenu: MenuEntry[] = [
  { value: 'rename', label: 'Rename', shortcut: 'F2' },
  { value: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D' },
  {
    type: 'submenu',
    value: 'export',
    label: 'Export as',
    items: [
      { value: 'export-pdf', label: 'PDF' },
      { value: 'export-png', label: 'PNG image' },
      {
        type: 'submenu',
        value: 'export-code',
        label: 'Code',
        items: [
          { value: 'export-html', label: 'HTML' },
          { value: 'export-md', label: 'Markdown' },
        ],
      },
    ],
  },
  { value: 'archive', label: 'Archive (disabled)', disabled: true },
  { type: 'separator' },
  { value: 'docs', label: 'Open the docs', href: '#menu' },
  { type: 'separator' },
  { value: 'delete', label: 'Delete', tone: 'danger', shortcut: 'Del' },
]

export function viewMenu(view: ViewState): MenuEntry[] {
  return [
    {
      type: 'group',
      label: 'Show',
      items: [
        { type: 'checkbox', value: 'grid', label: 'Grid', checked: view.grid },
        { type: 'checkbox', value: 'rulers', label: 'Rulers', checked: view.rulers },
      ],
    },
    { type: 'separator' },
    {
      type: 'group',
      label: 'Density',
      items: [
        { type: 'radio', value: 'compact', label: 'Compact', checked: view.density === 'compact' },
        { type: 'radio', value: 'comfortable', label: 'Comfortable', checked: view.density === 'comfortable' },
      ],
    },
  ]
}

/** The owner's answer to a choice in the view menu. */
export function applyView(view: ViewState, value: string, checked?: boolean): ViewState {
  if (value === 'grid' || value === 'rulers') return { ...view, [value]: Boolean(checked) }
  if (value === 'compact' || value === 'comfortable') return { ...view, density: value }
  return view
}

export const describeView = (view: ViewState) =>
  `grid ${view.grid ? 'on' : 'off'}  rulers ${view.rulers ? 'on' : 'off'}  density ${view.density}`

/** An application menubar. `&` marks each menu's access key. The View menu is the view menu above. */
export function appMenus(view: ViewState): MenubarMenu[] {
  return [
    {
      value: 'file',
      label: '&File',
      items: [
        { value: 'new', label: 'New', shortcut: 'Ctrl+N' },
        { value: 'open', label: 'Open…', shortcut: 'Ctrl+O' },
        {
          type: 'submenu',
          value: 'recent',
          label: 'Open Recent',
          items: [
            { value: 'recent-atlas', label: 'atlas.md' },
            { value: 'recent-notes', label: 'notes.txt' },
            { type: 'separator' },
            { value: 'recent-clear', label: 'Clear Recent' },
          ],
        },
        { type: 'separator' },
        { value: 'save', label: 'Save', shortcut: 'Ctrl+S' },
        { value: 'save-as', label: 'Save As…', shortcut: 'Ctrl+Shift+S' },
        { type: 'separator' },
        { value: 'quit', label: 'Quit', shortcut: 'Ctrl+Q' },
      ],
    },
    {
      value: 'edit',
      label: '&Edit',
      items: [
        { value: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
        { value: 'redo', label: 'Redo (nothing to redo)', shortcut: 'Ctrl+Y', disabled: true },
        { type: 'separator' },
        { value: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
        { value: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
        { value: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
      ],
    },
    { value: 'view', label: '&View', items: viewMenu(view) },
    { value: 'window', label: '&Window (disabled)', disabled: true, items: [] },
    {
      value: 'help',
      label: '&Help',
      items: [
        { value: 'docs', label: 'Documentation', href: '#menubar' },
        { value: 'about', label: 'About ggary-ui' },
      ],
    },
  ]
}

export const propertyTabs: TabItem[] = [
  { value: 'geometry', label: 'Geometry' },
  { value: 'material', label: 'Material' },
  { value: 'physics', label: 'Physics (disabled)', disabled: true },
  { value: 'scripts', label: 'Scripts' },
]

export const propertyPanels: Record<string, string> = {
  geometry: '12 480 vertices, 6 240 polygons.',
  material: 'Standard PBR, two textures.',
  physics: 'A convex hull, a mass of 4.2 kg.',
  scripts: 'Two behaviours attached.',
}

export const openFiles: TabItem[] = [
  { value: 'tokens.css', label: 'tokens.css', closable: true },
  { value: 'layout.css', label: 'layout.css', closable: true, modified: true },
  { value: 'components.css', label: 'components.css', closable: true },
  { value: 'README.md', label: 'README.md', closable: true },
]

let untitled = 0
export const newFile = (): TabItem => ({ value: `untitled-${++untitled}`, label: `untitled-${untitled}.css`, closable: true, modified: true })

/** The navigation demos, the same on every page. */
export const crumbs = [
  { label: 'Projects', href: '#projects' },
  { label: 'worldgen', href: '#worldgen' },
  { label: 'Run #4127' },
]

export const navGroups = [
  {
    label: 'Work',
    items: [
      { label: 'Runs', href: '#runs', icon: 'grid' as const, count: 7 },
      { label: 'Queue', href: '#queue', icon: 'list' as const },
      { label: 'Reports', href: '#reports', icon: 'chart' as const },
    ],
  },
  { label: 'Setup', items: [{ label: 'Parameters', href: '#parameters', icon: 'settings' as const }] },
]

export const importSteps = [
  { name: 'Source', state: 'done' as const },
  { name: 'Rules', state: 'done' as const },
  { name: 'Check', state: 'current' as const },
  { name: 'Launch', state: 'todo' as const },
]

/** The choice cards, the same on every page. */
export const runModes = [
  { value: 'parallel', title: 'In parallel', description: 'Up to 12 agents at once. Faster, but the token spend is higher and the order of the output is not guaranteed.' },
  { value: 'sequential', title: 'Sequentially', description: 'One agent at a time. Slower, but the log reads top to bottom with no interleaving.' },
  { value: 'manual', title: 'One step at a time', description: 'Every step waits for you. For a run you do not trust yet.', disabled: true },
]

export const runExtras = [
  { value: 'trace', title: 'Collect a trace', description: 'A full log of every step. The run becomes about 15% slower.' },
  { value: 'notify', title: 'Notify on completion', description: 'An email to the account address when the queue empties.' },
]

/** The segmented control's options, the same on every page. */
export const viewModes = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table', disabled: true },
]

export const densities = [
  { value: 'compact', label: 'Compact' },
  { value: 'regular', label: 'Regular' },
  { value: 'comfortable', label: 'Roomy' },
]

export const agentsText = (value: number) => `${value} ${value === 1 ? 'agent' : 'agents'}`

/** People for the avatar group, the same on every page. Pictures are left out on purpose: the initials are the demo. */
export const people = [
  { name: 'Ada Lovelace' },
  { name: 'Alan Turing' },
  { name: 'Grace Hopper' },
  { name: 'Edsger Dijkstra' },
  { name: 'Barbara Liskov' },
]

export const badgeTones = [
  { tone: 'neutral', label: 'Draft' },
  { tone: 'running', label: 'Running' },
  { tone: 'ok', label: 'Passed' },
  { tone: 'warn', label: 'Flaky' },
  { tone: 'error', label: 'Failed' },
] as const

/** The toasts the demo buttons show, the same on every page. */
export const toastDemos = {
  queued: { tone: 'ok', title: 'The run is queued', text: 'worldbox-1 · seventh in the queue' },
  failed: { tone: 'error', title: 'Could not send', text: 'The network is unavailable. Attempt 3 of 5.' },
  warn: { tone: 'warn', title: 'Disk almost full', text: '92% of 512 GB used' },
} as const

/** The layout demos, the same on every page. */
export const railItems = [
  { label: 'Leads', href: '#rail-leads', icon: 'list' as const, count: 3, current: true },
  { label: 'Deals', href: '#rail-deals', icon: 'grid' as const },
  { label: 'Reports', href: '#rail-reports', icon: 'chart' as const },
  { label: 'Settings', href: '#rail-settings', icon: 'settings' as const, end: true },
]

export const layoutLeads = ['Acme Labs 214', 'Borealis Group 77', 'Cobalt Works 902', 'Delta Retail 18', 'Ember Studio 450', 'Fjord Logistics 33', 'Granite Holding 610']

export const HINT_SHELL =
  'The frame of an application: the side column, the header, the work area and the status strip, each scrolling on its own. On a window under 60rem the column becomes a drawer behind the button in the header — Escape or a press outside closes it, the page under it is inert, and following a link closes it too; collapse="bar" lays it down under the header instead. Tab once from the top of the frame for the skip link. The separator between the list and the lead is dragged, or moved from the keyboard: arrows, Shift for bigger steps, Home and End, Enter folds the list away, a double click puts it back.'

export const HINT_RAIL =
  'The sections as a narrow column: a glyph over a short name, so nobody has to learn the pictures. The current one has a fill and a mark at its edge; the ones marked end stand at the bottom.'

export const HINT_FLOW =
  'The top of a screen and the stretches under it. The page header says where you are (breadcrumbs above), what this is, and what can be done with it; its actions fall under the title when there is no room. A section is a heading with no box, and sections stand farther apart than the rows inside one. The grid of cards falls to fewer columns as the window narrows, with no breakpoint; the stack stretches the field to its width and leaves the button at its own.'

export const weekTiles = [
  { title: 'New leads', value: '1,284' },
  { title: 'Won', value: '96' },
  { title: 'Paid', value: 'RUB 4.2M' },
  { title: 'Unassigned', value: '104,802' },
]

/** Saturdays and Sundays: no calls booked. */
export const isWeekend = (date: string) => {
  const day = new Date(date + 'T00:00:00Z').getUTCDay()
  return day === 0 || day === 6
}

export const HINT_DATES =
  'Type a day the way your locale writes it — 18.09.2026, 9/18/2026, 18 Sep 2026 — and press Enter or move on; the field shows it back in the locale\'s words and submits it as 2026-09-18. Or open the calendar: arrows walk the days and cross into the next month, Home and End go to the ends of the week, PageUp and PageDown a month (with Shift, a year), Enter chooses. A range is two presses in either order, drawn under the pointer before the second; it submits as one ISO interval, 2026-09-01/2026-09-18. The week starts where the locale\'s does. The range picker has presets beside its month: today, yesterday, the last 7 and 30 days, this month, last month — one press chooses and closes.'

/** Where a lead is: country, region, city — the cascader's tree. */
export const regions = [
  {
    value: 'ru',
    label: 'Russia',
    children: [
      { value: 'msk', label: 'Moscow' },
      { value: 'spb', label: 'Saint Petersburg' },
      {
        value: 'tat',
        label: 'Tatarstan',
        children: [
          { value: 'kzn', label: 'Kazan' },
          { value: 'chelny', label: 'Naberezhnye Chelny' },
          { value: 'alm', label: 'Almetyevsk' },
        ],
      },
      {
        value: 'sam',
        label: 'Samara Oblast',
        children: [
          { value: 'samara', label: 'Samara' },
          { value: 'tlt', label: 'Tolyatti' },
        ],
      },
    ],
  },
  {
    value: 'kz',
    label: 'Kazakhstan',
    children: [
      { value: 'ala', label: 'Almaty' },
      { value: 'ast', label: 'Astana' },
      { value: 'shy', label: 'Shymkent', disabled: true },
    ],
  },
  {
    value: 'rs',
    label: 'Serbia',
    children: [
      { value: 'beg', label: 'Belgrade' },
      { value: 'ns', label: 'Novi Sad' },
    ],
  },
]

/** A team is a place of its own: any level may be chosen. */
export const teams = [
  {
    value: 'sales',
    label: 'Sales',
    children: [
      { value: 'smb', label: 'Small business', children: [{ value: 'smb-east', label: 'East' }, { value: 'smb-west', label: 'West' }] },
      { value: 'ent', label: 'Enterprise' },
    ],
  },
  { value: 'support', label: 'Support', children: [{ value: 'l1', label: 'First line' }, { value: 'l2', label: 'Second line' }] },
  { value: 'product', label: 'Product' },
]

export const HINT_CASCADER =
  'A choice from a tree, one level to a column. Open it with a press or ArrowDown; Up and Down walk a column, Right goes into the children and Left back out, Enter chooses. A press on a branch opens it, a press on a leaf chooses. The button reads the whole path; the form gets the leaf. The team picker may stop at any level. Where the columns outrun the screen, the card scrolls sideways to the one the keyboard is on.'

/** The accordion's sections: a lead's card, as a sales rep reads it. */
export const leadSections = [
  { value: 'contact', label: 'Contact', description: 'Who to call, and when' },
  { value: 'deal', label: 'Deal', description: 'Stage, amount, next step' },
  { value: 'history', label: 'History' },
  { value: 'archive', label: 'Archived notes', disabled: true },
]

export const leadSectionText: Record<string, string> = {
  contact: 'Aigul Safina, head of procurement. Mornings, Kazan time; she prefers a call to an email.',
  deal: 'Negotiation, 1.2M ₽. The next step is the revised offer, due Friday.',
  history: 'First contact at the Innoprom fair in July; two demos since, the second with their IT lead.',
  archive: '',
}

/** The tree: a project's boards and columns, as a sidebar shows them. */
export const projectTree = [
  {
    value: 'sales',
    label: 'Sales',
    children: [
      { value: 'sales/leads', label: 'Leads', children: [{ value: 'sales/leads/new', label: 'New' }, { value: 'sales/leads/qualified', label: 'Qualified' }, { value: 'sales/leads/lost', label: 'Lost' }] },
      { value: 'sales/deals', label: 'Deals' },
    ],
  },
  {
    value: 'product',
    label: 'Product',
    children: [
      { value: 'product/roadmap', label: 'Roadmap' },
      { value: 'product/bugs', label: 'Bugs', children: [{ value: 'product/bugs/triage', label: 'Triage' }, { value: 'product/bugs/fixed', label: 'Fixed' }] },
    ],
  },
  { value: 'hr', label: 'HR', disabled: true, children: [{ value: 'hr/hiring', label: 'Hiring' }] },
  { value: 'wiki', label: 'Wiki' },
]

export const HINT_DISCLOSURE =
  'The accordion: one section at a time, a press or Enter opens it, Up and Down walk the buttons. A closed section is still in the page: press Ctrl+F and search for "Innoprom" — the browser opens History to show it. The tree: Up and Down walk the rows, Right opens a branch and steps in, Left steps out and closes it, Home and End, * opens every sibling, typing jumps to a name. A press on a row chooses it and opens or closes a branch; a press on the chevron only opens or closes. Progress: run the import to watch a bar and a ring move; a failed sync stays red.'

/** The kanban's board: a sales pipeline. */
export const dealStages = [
  { id: 'new', title: 'New' },
  { id: 'talks', title: 'In talks', limit: 3 },
  { id: 'offer', title: 'Offer sent' },
  { id: 'won', title: 'Won' },
]

export interface Deal {
  id: string
  column: string
  title: string
  company: string
  amount?: number
  labels?: string[]
  owner?: string
  /** A day, YYYY-MM-DD. */
  due?: string
  checklist?: { done: number; total: number }
}

/** Days from today, as YYYY-MM-DD: the demo's due dates stay near today whenever it is opened. */
const inDays = (days: number) => {
  const day = new Date(`${todayISO()}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + days)
  return day.toISOString().slice(0, 10)
}

const leadNames = ['Kazan Metro', 'Tatspirtprom', 'Innopolis Park', 'Kamaz Service', 'Taif Group', 'Ak Bars Bank', 'Sber Kazan', 'Kazanorgsintez', 'Tatenergo', 'Elabuga SEZ', 'Aviastar', 'Magnit Kazan']

export const initialDeals: Deal[] = [
  { id: 'd1', column: 'new', title: 'Warehouse automation', company: 'KamAZ Logistics', labels: ['Inbound'], owner: 'Aigul Safina', due: inDays(3), checklist: { done: 1, total: 4 } },
  { id: 'd2', column: 'new', title: 'CRM seats for sales', company: 'Tatneft Retail', amount: 480_000, labels: ['Renewal'], owner: 'Innokentiy Sokolov' },
  ...leadNames.map((company, i): Deal => ({ id: `n${i}`, column: 'new', title: `First call: ${company}`, company, owner: i % 3 === 0 ? 'Rustem Galiev' : undefined, due: i % 4 === 0 ? inDays(i - 2) : undefined })),
  { id: 'd3', column: 'talks', title: 'Onboarding pilot', company: 'Ak Bars Digital', amount: 1_200_000, labels: ['Pilot', 'Priority'], owner: 'Aigul Safina', due: inDays(-2), checklist: { done: 3, total: 5 } },
  { id: 'd4', column: 'talks', title: 'Support contract', company: 'Kazan Helicopters', owner: 'Rustem Galiev', due: inDays(9) },
  { id: 'd5', column: 'talks', title: 'Training days', company: 'Innopolis University', amount: 260_000, labels: ['Education'], checklist: { done: 2, total: 2 } },
  { id: 'd6', column: 'offer', title: 'Annual licence', company: 'Sber Kazan', amount: 2_400_000, labels: ['Priority'], owner: 'Innokentiy Sokolov', due: inDays(0), checklist: { done: 5, total: 6 } },
  { id: 'd7', column: 'won', title: 'Integration with 1C', company: 'Nizhnekamskneftekhim', amount: 900_000, owner: 'Aigul Safina' },
]

/** The pretend server: a move takes half a second, and a deal is not won without an amount. */
export const saveDealMove = (deal: Deal, to: string) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (to === 'won' && deal.amount === undefined ? reject(new Error('a deal needs an amount before it is won')) : resolve()), 500)
  )

/** When a deal is due, in words and as a state: overdue, today, or later. The words say it, not the colour alone. */
export const dueOf = (due: string) => {
  const today = todayISO()
  const day = new Date(`${due}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  if (due < today) return { state: 'overdue', text: `Overdue ${day}` }
  if (due === today) return { state: 'today', text: 'Due today' }
  return { state: 'later', text: `Due ${day}` }
}

export const dealMenu = [
  { value: 'copy-link', label: 'Copy link' },
  { value: 'archive', label: 'Archive', tone: 'danger' as const },
]

/** The pretend server: a new deal takes a moment, and a title in capitals is refused. */
export const saveNewDeal = (title: string) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (title === title.toUpperCase() && /[A-ZА-Я]/.test(title) ? reject(new Error('no titles in capitals, please')) : resolve()), 400))

export const formatAmount = (amount?: number) => (amount === undefined ? 'No amount yet' : `${amount.toLocaleString('ru-RU')} ₽`)

export const HINT_KANBAN =
  'Tab to the board: one stop, on a card. The arrows walk the cards; Space picks the focused one up, and then the arrows carry it — up and down, across the columns, Home and End — while a screen reader hears where it is; Space or Enter drops it, Escape puts it back, and Tab away does too. Enter on a card opens it. A move stands at once and fades until the pretend server answers, half a second later; move a deal with no amount into Won and it is refused — the card goes back and the reason is read out. In talks has a limit of 3: past it, the count turns red. The board is held to a height here: each column scrolls its own cards, and a card dragged to a column\u2019s top or bottom scrolls it. Right-click a card, press Shift+F10 on it, or use its ⋯ button for its menu: Move to another column, to the top or the bottom, or the demo\u2019s own Copy link and Archive. Add a card at a column\u2019s foot: Enter adds it and leaves the field open for the next; a title in capitals is refused and comes back to the field. Or drag a card: past a few pixels it comes up, a copy follows the pointer and the card’s slot moves where it would land; near the board’s edge the board scrolls; Escape puts it back. On a touch screen, hold a card still for a moment to pick it up — a quick swipe still scrolls.'

/**
 * The sandbox's commands: its sections to go to, and a few things to do. Read
 * from the page once it is drawn, so every section has its own title.
 */
export function sandboxCommands(notify: (text: string) => void): PaletteCommand[] {
  const sections = [...document.querySelectorAll<HTMLElement>('section[id]')].map((section) => ({ id: section.id, title: section.querySelector('h2')?.textContent ?? section.id }))
  return [
    {
      id: 'mode',
      label: 'Colour mode',
      group: 'Actions',
      keywords: ['dark', 'light', 'theme', 'appearance'],
      placeholder: 'Which mode?',
      children: ['system', 'light', 'dark'].map((mode) => ({ id: `mode:${mode}`, label: mode[0].toUpperCase() + mode.slice(1), run: () => setMode(mode as Mode) })),
    },
    { id: 'notify', label: 'Show a notification', group: 'Actions', keywords: ['toast'], run: () => notify('Sent from the command palette') },
    { id: 'top', label: 'Back to the top', group: 'Actions', shortcut: 'Home', run: () => window.scrollTo({ top: 0 }) },
    { id: 'export', label: 'Export the grid to CSV', group: 'Actions', description: 'Not in this palette: use the grid’s own button', disabled: true },
    ...sections.map((section) => ({
      id: `go:${section.id}`,
      label: section.title,
      group: 'Go to',
      run: () => document.getElementById(section.id)?.scrollIntoView({ block: 'start' }),
    })),
  ]
}

export const HINT_PALETTE =
  'Press Ctrl+K (⌘K on a Mac) anywhere on the page, or the button. Type to find a section to go to or a thing to do; the arrows move, Enter runs, a press does too. Colour mode opens a level of its own: Backspace in the empty field or Escape goes back up, Escape at the top closes. Type two letters of a company — "ke", "or" — and the leads that match come from the pretend server under Results.'

/** The new deal form's stages, for its Select. */
export const stageItems = [
  { value: 'new', label: 'New' },
  { value: 'talks', label: 'In talks' },
  { value: 'offer', label: 'Offer sent' },
  { value: 'won', label: 'Won' },
]

/** What the browser cannot check about a new deal. */
export function dealFormRules(data: FormData) {
  const stage = String(data.get('stage') ?? '')
  const due = String(data.get('due') ?? '')
  return {
    company: data.get('company') ? null : 'Choose the company',
    stage: stage ? null : 'Choose a stage',
    amount: (stage === 'offer' || stage === 'won') && !data.get('amount') ? 'An offer needs an amount' : null,
    due: !due ? 'Choose the day it should close by' : due < todayISO() ? 'The day has passed' : null,
  }
}

/** The pretend server: a title that exists already is refused, with a message for the whole form. */
export async function saveDealForm(data: FormData) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const title = String(data.get('title') ?? '').trim()
  if (['annual licence', 'onboarding pilot'].includes(title.toLowerCase())) {
    return { errors: { title: 'A deal with this title exists' }, message: 'The deal was not saved.' }
  }
  return undefined
}

export const HINT_FORM =
  'Press Create deal with nothing filled in: the form stops, each field says what is wrong — the browser’s own checks for the title and the email, the form’s rules for the company, stage and date, whose hidden inputs the browser does not check — and the summary at the top lists every error as a link and takes the focus. Fix a field and its error leaves as you type; set the stage to Offer sent and the amount becomes required. Fill it in with the title “Annual licence” and the pretend server refuses it after half a second: the error comes back to the title, and the summary says why.'

/** The Gantt's plan: a CRM rollout, dated around today so today's line always crosses it. */
/** The rollout's phases; the kickoff, the rollout itself and the launch stand on their own. */
export const rolloutGroups = [
  { id: 'phase-prep', title: 'Preparation' },
  { id: 'phase-setup', title: 'Setup' },
  { id: 'phase-pilot', title: 'Pilot' },
]

export const rolloutPlan = [
  { id: 'kickoff', title: 'Kickoff with sales', start: inDays(-21), end: inDays(-21), milestone: true, locked: true },
  { id: 'audit', title: 'Audit the old pipeline', start: inDays(-20), end: inDays(-12), progress: 1, locked: true, dependsOn: ['kickoff'], group: 'phase-prep' },
  { id: 'fields', title: 'Agree the deal fields', start: inDays(-11), end: inDays(-4), progress: 1, locked: true, dependsOn: ['audit'], group: 'phase-prep' },
  { id: 'import', title: 'Import 700,000 leads', start: inDays(-5), end: inDays(6), progress: 0.55, dependsOn: ['fields'], group: 'phase-setup' },
  { id: 'boards', title: 'Set up the boards', start: inDays(-2), end: inDays(9), progress: 0.2, dependsOn: ['fields'], group: 'phase-setup' },
  { id: 'training', title: 'Train the team', start: inDays(8), end: inDays(14), progress: 0, dependsOn: ['import'], group: 'phase-setup' },
  { id: 'pilot', title: 'Pilot in Kazan', start: inDays(12), end: inDays(26), progress: 0, dependsOn: ['boards'], group: 'phase-pilot' },
  { id: 'review', title: 'Review the pilot', start: inDays(27), end: inDays(27), milestone: true, dependsOn: ['pilot', 'training'], group: 'phase-pilot' },
  { id: 'rollout', title: 'Roll out to every office', start: inDays(28), end: inDays(55), progress: 0, dependsOn: ['phase-pilot'] },
  { id: 'launch', title: 'Launch', start: inDays(56), end: inDays(56), milestone: true, dependsOn: ['rollout'] },
]

/** The pretend server: a change takes a moment, and nothing may end after the launch. */
export async function saveTaskDates(taskId: string, to: { start: string; end: string }) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (taskId !== 'launch' && to.end >= inDays(56)) throw new Error('nothing may end after the launch')
}

export const ganttScales = [
  { value: 'day', label: 'Days' },
  { value: 'week', label: 'Weeks' },
  { value: 'month', label: 'Months' },
]

export const HINT_GANTT =
  'The chart opens on today, a third of the way in. Tab to it: one stop, on a task. Up and Down walk the tasks — the row is tinted, the bar ringed, and a bar out of sight is brought into view clear of the list — Home and End, PageUp and PageDown; Enter or a double press opens one. A screen reader hears a grid: the task’s name as the row’s header, then its dates in words, how many days, how far along, and what it waits for. Switch the scale: days, weeks, months — the core counts in days and the theme says how wide a day is. Drag a bar to move it, or either end to resize it; or with its task focused, Left and Right move it a day (Shift, a week) and Alt with them moves its end — the change is said as it is made, and kept when the keys pause, on Enter, or on moving to another task; Escape puts it back. The pretend server takes a moment and refuses anything that would end after the launch: the bar goes back and the reason is read out. The done tasks are locked. An arrow runs from each task to the ones that wait for it, and turns red where one starts before the other ends — as the import does now; move it and the arrows follow. The tasks are grouped in phases: a phase’s bar runs from its first task’s start to its last one’s end, filled as far as they have got, and a press on its name — or Left and Right on its row — closes and opens it; the rollout waits for the whole pilot phase, its arrow from the phase’s bar. With a phase closed, its tasks’ arrows go from its row.'

/** The readouts demo: one nightly run, told as figures, facts, changes and events. */
export const runMetrics = [
  { label: 'Run time', value: 42, unit: 's', delta: '18% faster than the last', direction: 'down' as const, tone: 'ok' as const },
  { label: 'Tests passed', value: 248, unit: '/251', delta: '3 failing', tone: 'warn' as const },
  { label: 'Warnings', value: 12, delta: '5 new', direction: 'up' as const, tone: 'error' as const },
]
export const headlineMetrics = [
  { label: 'Success rate', value: '94.2', unit: '%', delta: '1.8 points down in a week', direction: 'down' as const, tone: 'warn' as const },
  { label: 'Duration p95', value: '4:12', unit: 'min', delta: 'median 2:48' },
  { label: 'In the queue', value: 37, delta: '9 waiting over an hour', direction: 'up' as const, tone: 'warn' as const },
]
export const runFacts = [
  { label: 'Pipeline', value: 'nightly' },
  { label: 'Started', value: '02:14:07' },
  { label: 'Runner', value: 'eu-west-3' },
  { label: 'Commit', value: '2f8a1c04-9b7e-4d31-a5f0-c6e2' },
]
export const changedFiles = [
  { change: 'added' as const, path: 'src/import/leads.ts' },
  { change: 'modified' as const, path: 'src/grid/filters.ts' },
  { change: 'deleted' as const, path: 'src/legacy/csv.ts' },
  { change: 'renamed' as const, path: 'docs/intro.md → docs/start.md' },
  { change: 'conflict' as const, path: 'package.json' },
]
export const runEvents = [
  { id: 'e4', title: 'Run finished with 3 failing tests', detail: '4 files changed', time: '2026-09-22T02:15:49', tone: 'warn' as const },
  { id: 'e3', title: 'Tests running', detail: '251 in 6 shards', time: '2026-09-22T02:14:52', tone: 'running' as const },
  { id: 'e2', title: 'Build succeeded', detail: 'bundle 7.4 MB', time: '2026-09-22T02:14:31', tone: 'ok' as const },
  { id: 'e1', title: 'Queued', time: '2026-09-22T02:14:07' },
]
/**
 * A pseudo-random stream from a fixed seed (mulberry32): the sandbox needs a
 * year of plausible numbers, and a page that redrew itself differently on
 * every reload would make every screenshot and every eye-check a new picture.
 */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A day of a monitored service, by outcome: the four parts add up to 24 hours. */
export const dayOutcomes = [
  { label: 'up', value: 22.1, tone: 'ok' as const },
  { label: 'degraded', value: 1.4, tone: 'warn' as const },
  { label: 'down', value: 0.4, tone: 'error' as const },
  { label: 'not checked', value: 0.1, tone: 'neutral' as const },
]

/** A year of nightly runs, ending today: busy on weekdays, quiet at weekends, with idle days throughout. */
export const runYear = (() => {
  const random = seeded(20260922)
  const last = todayISO()
  return Array.from({ length: 365 }, (_, i) => {
    const date = addDays(last, i - 364)
    const weekend = weekday(date) === 0 || weekday(date) === 6
    const idle = random() < (weekend ? 0.6 : 0.1)
    const busy = weekend ? 4 : 12
    return { date, value: idle ? 0 : Math.max(1, Math.round(busy * (0.3 + random() * 1.5))) }
  })
})()

export const HINT_READOUTS =
  'A metric is one watched number: its unit smaller and quieter, and its change in words — which way it went (the arrow) and whether that is good (the colour) are two separate things, so "18% faster" is green going down and "5 new" is red going up. A joined row is one fact about the screen; separate tiles are a set of numbers. The key–value list is a real <dl>, its names in one column across lists. A file change is a sign in an outline, its word said to a screen reader. The timeline is an ordered list with real <time> values; each dot takes its tone, and a running one pulses — as a dot inside a badge does, since both read the same tone. The share bar is what a period was made OF: one strip divided by each part’s share, the percentages rounded in core so they still total 100 and a part with a value never rounded away to nothing. Its parts take TONES here, because they are outcomes; categories would take the chart palette instead. The bar is one picture with one name — the reading in words — so the words beside it are what say which colour is which. The heatmap is a year of nightly runs, a column a week: its axis is intensity, not a category, so it is one hue at five strengths, the step of each day computed in core from the numbers and the five colours held by the theme. It is one picture too, named by the quantity; a cell carries a title for the pointer and is hidden from a screen reader, which could not usefully walk 365 of them.'

export const generatorSource = `export function terrain(size = 256, seed = Date.now()) {
  const noise = createNoise(seed)
  return generate(size, (x, y) => noise.fractal(x / size, y / size, { octaves: 6, persistence: 0.5, lacunarity: 2 }))
}`
export const templateInserts = [
  { value: '{{name}}', hint: 'The name of the monitor' },
  { value: '{{target}}', hint: 'The address checked' },
  { value: '{{status}}', hint: 'The state' },
  { value: '{{error}}', hint: 'The text of the error' },
  { value: '{{time}}', hint: 'The time of the event' },
]
export const HINT_CODE =
  'Code never wraps — a wrap can change a command — so it scrolls sideways, and the scroller is a named region the keyboard can reach. The copy button is always there (touch has no hover) and names what it copies; a press copies, shows a tick for a moment and says "Copied" to a screen reader, falling back to the old copy command when the clipboard refuses. A copyable value is the same for one line: a hash, an id, a path. Inserts put their value where the caret is in the field, replacing a selection, and hand the focus back to the field — put the caret mid-line and press one.'
