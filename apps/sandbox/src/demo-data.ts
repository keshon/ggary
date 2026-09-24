import type { ChipItem } from '@ggary/core/chip-group'
import { addDays, todayISO, weekday } from '@ggary/core'
import type { PaletteCommand } from '@ggary/core/command-palette'
import { setMode, type Mode } from './theme'
import type { MenuEntry } from '@ggary/core/menu'
import type { MenubarMenu } from '@ggary/core/menubar'
import type { TabItem } from '@ggary/core/tabs'
import type { SelectItem } from '@ggary/core/select'
import type { RunUnit } from '@ggary/core/run'
import type { TaskItem } from '@ggary/core/task'
import type { HistoryGroup, HistoryTick } from '@ggary/core/history'

/** The kit's one size scale, for the row that shows a control at each. */
export const controlSizes = ['sm', 'md', 'lg'] as const
export const sizePlaces = [
  { value: 'eu', label: 'Europe', children: [{ value: 'de', label: 'Germany' }, { value: 'fr', label: 'France' }] },
  { value: 'as', label: 'Asia', children: [{ value: 'jp', label: 'Japan' }] },
]
/** What a markdown renderer hands Prose. */
export const proseSample = `<h2>Deploying a preview</h2>
<p>A preview is built from any branch you push. It gets its own address, and its checks run before anyone is asked to look at it — see <a href="#typography">how checks are chosen</a>.</p>
<h3>Before you push</h3>
<ol><li>Run <code>npm test</code> and <code>npm run typecheck</code>.</li><li>Keep the branch rebased on <code>main</code>.</li><li>Press <kbd>Ctrl</kbd> <kbd>K</kbd> and choose <em>Deploy preview</em>.</li></ol>
<blockquote><p>A preview that fails its checks is kept for a day, so the failure can be read.</p></blockquote>
<pre><code>npm run deploy -- --preview feature/billing</code></pre>
<h3>Limits</h3>
<table><thead><tr><th>Plan</th><th>Previews</th><th>Kept for</th></tr></thead><tbody><tr><td>Free</td><td>3</td><td>7 days</td></tr><tr><td>Team</td><td>25</td><td>30 days</td></tr></tbody></table>
<hr>
<p>Previews older than their plan allows are removed at night, <mark>without notice</mark>.</p>`

/** A file row's context menu. */
export const fileMenu = [
  { value: 'open', label: 'Open' },
  { value: 'rename', label: 'Rename', shortcut: 'F2' },
  { type: 'separator' as const },
  { value: 'delete', label: 'Delete', destructive: true, shortcut: 'Del' },
]
export const fileRows = ['report.pdf', 'budget.xlsx', 'notes.md']
/** A delete that takes a moment, and fails every other time, so both answers can be seen. */
let deletes = 0
export function slowDelete(): Promise<void> {
  deletes += 1
  const fails = deletes % 2 === 0
  return new Promise((resolve, reject) => setTimeout(() => (fails ? reject(new Error('The lead is locked by another editor.')) : resolve()), 900))
}

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
  { value: 'delete', label: 'Delete', destructive: true, shortcut: 'Del' },
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
  { value: 'archive', label: 'Archive', destructive: true },
]

/** The pretend server: a new deal takes a moment, and a title in capitals is refused. */
export const saveNewDeal = (title: string) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (title === title.toUpperCase() && /[A-ZА-Я]/.test(title) ? reject(new Error('no titles in capitals, please')) : resolve()), 400))

export const formatAmount = (amount?: number) => (amount === undefined ? 'No amount yet' : `${amount.toLocaleString('ru-RU')} ₽`)

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
/** Two budgets of the same run, each against its own ceiling: one comfortable, one at the wall. */
export const runBudgets = [
  { label: 'Tokens', value: 184320, max: 250000 },
  { label: 'Disk on the runner', value: 237, max: 240, tone: 'warn' as const, valueText: '237 of 240 GB' },
]
/** The same reading where a bar has no room: one ring named on its own, one hidden beside its words. */
export const runWindow = { value: 74, label: '74% of the nightly window used' }
export const runShards = { value: 18, max: 60, note: '18 of 60 shards finished' }
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
/** Eleven nights of run time, for the sparkline standing beside the metric that reports the last of them. */
export const runTimeTrend = [58, 61, 54, 57, 49, 52, 47, 50, 45, 44, 42]
/** Two suites over the same eleven nights. Two series, so each names its hue — and a legend names them in words. */
export const suiteSeries = [
  { label: 'Unit tests', series: 1 as const, value: '18.2 s', values: [24.6, 23.9, 25.1, 22.4, 23.0, 21.2, 21.8, 19.9, 20.4, 18.8, 18.2] },
  { label: 'Browser tests', series: 2 as const, value: '11.5 s', values: [12.4, 13.1, 12.0, 12.8, 11.9, 12.6, 11.4, 12.2, 11.1, 11.8, 11.5] },
]
/** The key, in the chart's own order: the number of a series is a contract, not a sort order. */
export const suiteLegend = suiteSeries.map(({ label, series, value }) => ({ label, series, value }))

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

export const generatorSource = `export function terrain(size = 256, seed = Date.now()) {
  const noise = createNoise(seed)
  return generate(size, (x, y) => noise.fractal(x / size, y / size, { octaves: 6, persistence: 0.5, lacunarity: 2 }))
}`
/**
 * One run of an agent on this very kit, caught with the answer still arriving:
 * the thread the chat section shows. The strings live here so the two pages
 * show the same conversation rather than two paraphrases of it.
 */
export const chatThread = {
  ask: 'Add a share bar above the history strip, and let one legend key both.',
  reasoning:
    'The strip answers when, the share answers how much. The legend swatch already falls through to the tone, so it can key both without a second vocabulary.',
  answer: "I'll put the bar above the strip and let the swatch read the tone.",
  followUp: 'Now drop the app rules this replaces.',
  reading: 'Reading the file those rules live in.',
  working: 'Sixty lines go. This rewrites the file in place, so I need permission',
}
/** The failure the run hit on the way, with what it had already tried. */
export const chatFailure = {
  title: 'Could not read static/beacon.css',
  code: 'EBUSY',
  reason: 'The file is locked by another process',
  tried: ['A retry after 1 s — the same code', 'A retry after 4 s — the same code'],
}
/** What permission is being asked for, and what it would touch. A tone here means irreversibility. */
export const chatApproval = {
  what: 'rm -rf build/ && npm run build',
  effects: [
    { text: 'It will delete the build/ directory entire — 1 284 files' },
    { text: 'Irreversible: the contents do not go to a recycle bin', tone: 'error' as const },
    { text: 'The rebuild will take about 40 s' },
  ],
}
/* --- the agent layer: one audit run, going on now ------------------------------- */

/** The phases of the run. The unit is an agent, and there are few — a bar at 57% would invent a precision the work has not got. */
export const runPhases: { id: string; label: string; units: RunUnit[] }[] = [
  {
    id: 'analysis',
    label: 'Analysis',
    units: [
      { tone: 'ok', title: 'analysis:docs-drift' },
      { tone: 'ok', title: 'analysis:shared-and-chunk' },
      { tone: 'warn', title: 'analysis:probes-assert' },
      { tone: 'ok', title: 'analysis:silent-failure' },
      { tone: 'running', title: 'analysis:coverage-hole' },
      { title: 'analysis:history' },
      { title: 'analysis:eyes-only' },
    ],
  },
  { id: 'refutation', label: 'Refutation', units: [{}, {}, {}] },
  { id: 'report', label: 'Report', units: [{ tone: 'error', title: 'report:link-check' }, {}] },
]

/** The counters of the run, beside its phases. */
export const runCounters = [
  { label: 'Running', value: '7 min 58 s' },
  { label: 'Agents', value: '12' },
  { label: 'Tokens', value: '186 000' },
]

/** The queue of agents: flat rows, a phase each, arriving while the work goes on. */
export const runTasks: TaskItem[] = [
  { value: 'docs-drift', title: 'analysis:docs-drift', detail: 'docs/ · 4 calls', meta: '18 s', state: 'done' },
  { value: 'shared-and-chunk', title: 'analysis:shared-and-chunk', detail: 'src/shared/ · 5 calls', meta: '18 s', state: 'done' },
  { value: 'probes-assert', title: 'analysis:probes-assert', detail: '2 probes assert nothing', meta: '18 s', state: 'warn' },
  { value: 'silent-failure', title: 'analysis:silent-failure', detail: 'src/runtime/ · 4 calls', meta: '18 s', state: 'done' },
  { value: 'coverage-hole', title: 'analysis:coverage-hole', detail: 'the third pass is going', meta: '14.0 s', state: 'running' },
  { value: 'history', title: 'analysis:history', detail: 'waiting for a free runner', meta: '—', state: 'queued' },
  { value: 'eyes-only', title: 'analysis:eyes-only', detail: 'waiting for a free runner', meta: '—', state: 'queued' },
  { value: 'refutation-a', title: 'refutation:class-a', detail: 'waiting for the analysis', meta: '—', state: 'queued' },
  { value: 'refutation-b', title: 'refutation:class-b', detail: 'waiting for the analysis', meta: '—', state: 'queued' },
  { value: 'link-check', title: 'report:link-check', detail: 'the network is off', meta: '0.4 s', state: 'failed' },
  { value: 'screenshots', title: 'report:screenshots', detail: 'skipped by a flag', meta: '—', state: 'skipped' },
]

/** What the run is spending, and how fast: the forecast is the reason a budget is not a meter. */
export const runSpending = [
  { label: 'Tokens', value: 186_000, max: 250_000, rate: 90, tone: 'warn' as const },
  { label: 'Agent minutes', value: 31, max: 60, rate: 0.117 },
]

/** The last twenty-four nightly audits of this workflow: one attempt, one mark. */
export const runHistory: HistoryTick[] = [
  ...Array.from({ length: 6 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { tone: 'error', title: 'failed: 3 probes assert nothing' },
  { tone: 'error', title: 'failed: 3 probes assert nothing' },
  ...Array.from({ length: 4 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { empty: true, title: 'no run: the runner was down' },
  { empty: true, title: 'no run: the runner was down' },
  ...Array.from({ length: 5 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { tone: 'warn', title: 'passed with 2 remarks' },
  ...Array.from({ length: 4 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { tone: 'running', title: 'going now' },
]

/** The same workflow by the hour: a batch is an hour, and its width is how many runs stand behind it. */
export const runHistoryHours: HistoryGroup[] = [
  { label: '02', ticks: [{ tone: 'ok' }], title: '02:00 — 1 run' },
  { label: '03', minor: true, ticks: [{ tone: 'ok' }, { tone: 'ok' }, { tone: 'ok' }], title: '03:00 — 3 runs' },
  { label: '04', minor: true, ticks: [{ tone: 'error' }, { tone: 'error' }, { tone: 'ok' }, { tone: 'ok' }, { tone: 'ok' }], title: '04:00 — 5 runs' },
  { label: '05', ticks: [{ tone: 'ok' }], count: 8, title: '05:00 — 8 runs, shown as one' },
  { label: '06', minor: true, ticks: [{ empty: true }], title: '06:00 — no runs' },
  { label: '07', minor: true, ticks: [{ tone: 'ok' }, { tone: 'warn' }, { tone: 'ok' }], title: '07:00 — 3 runs' },
  { label: '08', ticks: [{ tone: 'ok' }, { tone: 'ok' }, { tone: 'running' }], title: '08:00 — 3 runs' },
]

export const templateInserts = [
  { value: '{{name}}', hint: 'The name of the monitor' },
  { value: '{{target}}', hint: 'The address checked' },
  { value: '{{status}}', hint: 'The state' },
  { value: '{{error}}', hint: 'The text of the error' },
  { value: '{{time}}', hint: 'The time of the event' },
]

/* --- the agent's run: one attempt at the three tests that failed last night --- */

/** What the agent read before it changed anything. Cut at 40 of 240 lines. */
export const filtersExcerpt = `export function applyFilters(rows: Lead[], filters: Filter[]) {
  if (filters.length === 0) return rows
  return rows.filter((row) => filters.every((filter) => match(row, filter)))
}

function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  switch (filter.op) {
    case 'is': return value === filter.value
    case 'contains': return String(value).includes(filter.value)
    case 'before': return new Date(value) < new Date(filter.value)
  }
}`

/** The file as the night left it, and as the agent handed it back. */
export const filtersBefore = `function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  switch (filter.op) {
    case 'is':
      return value === filter.value
    case 'contains':
      return String(value).includes(filter.value)
    case 'before':
      return new Date(value) < new Date(filter.value)
  }
}
`
export const filtersAfter = `function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  if (value == null) return false
  switch (filter.op) {
    case 'is':
      return value === filter.value
    case 'contains':
      // an empty needle matched every row, including the ones with no value
      return filter.value !== '' && String(value).includes(filter.value)
    case 'before':
      return new Date(value) < new Date(filter.value)
  }
}
`

/** The output of the shard still running, as far as it has been written. */
export const shardOutput = `PASS  src/grid/filters.test.ts (18 tests)
PASS  src/grid/columns.test.ts (11 tests)
RUNS  src/import/leads.test.ts`

/** The stream of run 4127, oldest first. */
export const runLines = [
  { id: 'l1', level: 'info' as const, time: '02:14:07', text: 'Queued on eu-west-3' },
  { id: 'l2', level: 'info' as const, time: '02:14:31', text: 'Build succeeded, bundle 7.4 MB' },
  { id: 'l3', level: 'debug' as const, time: '02:14:33', text: 'cache hit: node_modules (412 MB)' },
  { id: 'l4', level: 'info' as const, time: '02:14:52', text: '251 tests in 6 shards' },
  { id: 'l5', level: 'warn' as const, time: '02:15:18', text: 'shard 4 is slower than its neighbours (86 s)' },
  { id: 'l6', level: 'error' as const, time: '02:15:49', text: 'AssertionError: applyFilters returned 40 rows, expected 0' },
  { id: 'l7', level: 'info' as const, time: '02:16:02', text: 'agent-01 opened src/grid/filters.ts' },
  { id: 'l8', level: 'debug' as const, time: '02:16:04', text: 'reading 240 lines' },
  { id: 'l9', level: 'info' as const, time: '02:16:40', text: 'agent-01 wrote src/grid/filters.ts (+3 −1)' },
  { id: 'l10', level: 'info' as const, time: '02:16:41', text: 'shard 4 restarted' },
  { id: 'l11', level: 'debug' as const, time: '02:16:44', text: 'PASS src/grid/filters.test.ts (18 tests)' },
  { id: 'l12', level: 'debug' as const, time: '02:16:47', text: 'PASS src/grid/columns.test.ts (11 tests)' },
]

/** A line that has not arrived yet: the reader presses for it. */
export const runNextLine = { id: 'l13', level: 'info' as const, time: '02:16:58', text: 'shard 4 finished: 41 tests, 0 failing' }

/** The shards of run 4127 on one axis: 0 s is 02:14:52, and shard 4 is still going. */
export const runLanes = [
  {
    id: 'shard-1',
    label: 'shard 1',
    spans: [
      { label: 'unit tests', start: 0, end: 38_000, tone: 'ok' as const },
      { label: 'coverage', start: 38_000, end: 47_000, tone: 'ok' as const },
    ],
  },
  { id: 'shard-2', label: 'shard 2', spans: [{ label: 'unit tests', start: 1000, end: 52_000, tone: 'ok' as const }] },
  {
    id: 'shard-3',
    label: 'shard 3',
    spans: [
      { label: 'unit tests', start: 1000, end: 44_000, tone: 'warn' as const },
      { label: 'retry', start: 46_000, end: 61_000, tone: 'ok' as const },
    ],
  },
  {
    id: 'shard-4',
    label: 'shard 4',
    spans: [
      { label: 'unit tests', start: 2000, end: 57_000, tone: 'error' as const },
      { label: 'the agent’s edit', start: 70_000, end: 109_000, tone: 'neutral' as const },
      { label: 'unit tests, again', start: 109_000, end: 126_000, tone: 'running' as const },
    ],
  },
  { id: 'shard-5', label: 'shard 5', spans: [{ label: 'unit tests', start: 2000, end: 40_000, tone: 'ok' as const }] },
  { id: 'shard-6', label: 'shard 6', spans: [{ label: 'unit tests', start: 3000, end: 35_000, tone: 'ok' as const }] },
]

/**
 * An upload with no server: a file goes at about 2 MB a second in steps, and
 * stops when it is cancelled. One whose name has "fail" in it is refused half
 * way, the way a server's 503 would be; one with "slow" never says how far.
 */
export function demoUpload(file: File, { signal, onProgress }: import('@ggary/core/upload').UploadContext): Promise<string> {
  return new Promise((resolve, reject) => {
    const total = Math.max(file.size, 1)
    const slow = /slow/i.test(file.name)
    let loaded = 0
    const timer = setInterval(() => {
      loaded = Math.min(total, loaded + Math.max(total / 12, 200_000))
      if (!slow) onProgress(loaded, total)
      if (/fail/i.test(file.name) && loaded >= total / 2) {
        clearInterval(timer)
        reject(new Error('The server said no (503)'))
      } else if (loaded >= total) {
        clearInterval(timer)
        resolve(`upload-${file.name}`)
      }
    }, slow ? 700 : 160)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(signal.reason)
    })
  })
}

/**
 * Upload's every state on the page at once, with nobody choosing a file: the
 * page drops these files on the zone as it loads, and this upload holds each
 * one where it should be seen — part way, done, failed, or never saying how far.
 * The too-large and wrong-type ones never reach it: the kit refuses them first.
 */
const stagedPlan: Record<string, 'done' | 'fail' | 'unknown' | number> = {
  'q3-report-final.pdf': 0.64,
  'brief-v2.docx': 'done',
  'contract-signed.pdf': 'fail',
  'board-deck.pdf': 'unknown',
  'harbour.png': 0.64,
  'sunset.png': 'done',
  'field.png': 'fail',
}
export function stagedUpload(file: File, { onProgress }: import('@ggary/core/upload').UploadContext): Promise<string> {
  const plan = stagedPlan[file.name] ?? 'done'
  if (plan === 'done') return Promise.resolve(`upload-${file.name}`)
  if (plan === 'fail') return Promise.reject(new Error('The server said no (503)'))
  if (typeof plan === 'number') onProgress(Math.round(plan * file.size), file.size)
  return new Promise(() => {})
}

const sized = (name: string, bytes: number, type = '') => new File([new ArrayBuffer(bytes)], name, { type })

/** In the order that leaves one going, one there, one failed, one never saying, and the last waiting for a place (two at a time). */
export const stagedRowFiles = () => [
  sized('q3-report-final.pdf', 3_800_000, 'application/pdf'),
  sized('brief-v2.docx', 1_200_000),
  sized('contract-signed.pdf', 900_000, 'application/pdf'),
  sized('scans-full.pdf', 24_000_000, 'application/pdf'),
  sized('board-deck.pdf', 6_400_000, 'application/pdf'),
  sized('notes.txt', 2_000, 'text/plain'),
  sized('appendix.pdf', 640_000, 'application/pdf'),
]

async function picture(name: string, from: string, to: string): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 160
  const paint = canvas.getContext('2d')!
  const fill = paint.createLinearGradient(0, 0, 160, 160)
  fill.addColorStop(0, from)
  fill.addColorStop(1, to)
  paint.fillStyle = fill
  paint.fillRect(0, 0, 160, 160)
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((made) => resolve(made!), 'image/png'))
  return new File([blob], name, { type: 'image/png' })
}

export const stagedTileFiles = async () => [
  await picture('harbour.png', '#9cc3e8', '#2f5d8a'),
  await picture('sunset.png', '#f3b37a', '#6c4a5c'),
  await picture('field.png', '#b7d9b0', '#3d6b45'),
  sized('notes.txt', 2_000, 'text/plain'),
]

/** A drop on the Upload inside `host`, as a person would make one. */
export function stageDrop(host: HTMLElement, files: File[]) {
  const zone = host.querySelector<HTMLElement>('[data-scope="file-drop"][data-part="root"]')
  if (!zone) return
  const transfer = new DataTransfer()
  for (const file of files) transfer.items.add(file)
  zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }))
  zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
}

/** A face already there, for the avatar's one tile. */
export const avatarPicture = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7b8f5"/><stop offset="1" stop-color="#5b4bb7"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#efeafd"/><path d="M18 100c4-22 18-32 32-32s28 10 32 32z" fill="#efeafd"/></svg>')}`

/** The people reviewing a change: List's rows, with every state a row can be in. */
export interface Reviewer {
  name: string
  line: string
  tone: import('@ggary/core').StatusTone
  word: string
  when: string
  current?: boolean
  disabled?: boolean
}
export const reviewers: Reviewer[] = [
  { name: 'Anna Petrova', line: 'Approved the budget change for the Q4 rollout', tone: 'ok', word: 'Approved', when: '2h' },
  { name: 'Mark Chen', line: 'Asked for changes on the migration plan — 2 comments', tone: 'warn', word: 'Changes', when: '5h' },
  { name: 'Leila Haddad', line: 'Reading the diff now', tone: 'running', word: 'Reviewing', when: 'now', current: true },
  { name: 'Tom Øberg', line: 'Left the team — can no longer review', tone: 'neutral', word: 'Away', when: '—', disabled: true },
]
export const moreReviewers: Reviewer[] = [
  { name: 'Priya Nair', line: 'Not started', tone: 'neutral', word: 'Waiting', when: '—' },
  { name: 'Jonas Weber', line: 'Approved with one nit', tone: 'ok', word: 'Approved', when: '1d' },
]
/** "Show more" as a server would answer it: a moment later. */
export const reviewersLater = () => new Promise<Reviewer[]>((resolve) => setTimeout(() => resolve(moreReviewers), 900))

/** The same few components under three providers: the labels are the app's, in each column's language; the rest is the provider's. */
export interface ConfigSample {
  title: string
  config: import('@ggary/core/config-provider').KitConfig
  text: { save: string; name: string; starts: string; due: string; price: string; files: string; first: string; second: string }
}
export const configSamples: ConfigSample[] = [
  {
    title: 'No provider',
    config: {},
    text: { save: 'Save', name: 'Name', starts: 'Starts at', due: 'Due', price: 'Price', files: 'Files', first: 'Report', second: 'Brief' },
  },
  {
    title: 'ru-RU · sm · Russian words',
    config: {
      locale: 'ru-RU',
      size: 'sm',
      words: {
        list: { more: 'Показать ещё', loading: 'Загрузка…' },
        rangeSlider: { start: 'Минимум', end: 'Максимум' },
        timePicker: { choose: 'Выбрать время' },
        datePicker: { choose: 'Выбрать день' },
      },
    },
    text: { save: 'Сохранить', name: 'Имя', starts: 'Начало', due: 'Срок', price: 'Цена', files: 'Файлы', first: 'Отчёт', second: 'Бриф' },
  },
  {
    title: 'ar-EG · rtl · lg · dark',
    config: { locale: 'ar-EG', dir: 'rtl', size: 'lg', mode: 'dark', words: { list: { more: 'عرض المزيد' } } },
    text: { save: 'حفظ', name: 'الاسم', starts: 'يبدأ', due: 'الموعد', price: 'السعر', files: 'الملفات', first: 'تقرير', second: 'موجز' },
  },
]
