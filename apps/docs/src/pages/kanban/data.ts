import type { StatusTone } from '@ggary/core'

/** A sales pipeline: Kanban's columns and cards. */
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
  /** When it is due, in words, and whether that is late: fixed, so the page reads the same any day. */
  due?: { text: string; tone: StatusTone }
  checklist?: { done: number; total: number }
}

export const deals: Deal[] = [
  { id: 'd1', column: 'new', title: 'Warehouse automation', company: 'KamAZ Logistics', labels: ['Inbound'], owner: 'Aigul Safina', due: { text: 'Due 28 Sep', tone: 'neutral' }, checklist: { done: 1, total: 4 } },
  { id: 'd2', column: 'new', title: 'CRM seats for sales', company: 'Tatneft Retail', amount: 480_000, labels: ['Renewal'], owner: 'Innokentiy Sokolov' },
  { id: 'd3', column: 'talks', title: 'Onboarding pilot', company: 'Ak Bars Digital', amount: 1_200_000, labels: ['Pilot', 'Priority'], owner: 'Aigul Safina', due: { text: 'Overdue 23 Sep', tone: 'error' }, checklist: { done: 3, total: 5 } },
  { id: 'd4', column: 'talks', title: 'Support contract', company: 'Kazan Helicopters', owner: 'Rustem Galiev', due: { text: 'Due 4 Oct', tone: 'neutral' } },
  { id: 'd5', column: 'talks', title: 'Training days', company: 'Innopolis University', amount: 260_000, labels: ['Education'], checklist: { done: 2, total: 2 } },
  { id: 'd6', column: 'offer', title: 'Annual licence', company: 'Sber Kazan', amount: 2_400_000, labels: ['Priority'], owner: 'Innokentiy Sokolov', due: { text: 'Due today', tone: 'warn' }, checklist: { done: 5, total: 6 } },
  { id: 'd7', column: 'won', title: 'Integration with 1C', company: 'Nizhnekamskneftekhim', amount: 900_000, owner: 'Aigul Safina' },
]

/** One deal too many in talks, and nothing won yet: a column past its limit, and an empty one. */
export const crowded: Deal[] = [
  ...deals.filter((deal) => deal.column !== 'won'),
  { id: 'd8', column: 'talks', title: 'Second office', company: 'Taif Group', owner: 'Rustem Galiev' },
]

/** First calls to make: enough to outrun a column held to a height. */
const leadNames = ['Kazan Metro', 'Tatspirtprom', 'Innopolis Park', 'Kamaz Service', 'Taif Group', 'Ak Bars Bank', 'Sber Kazan', 'Kazanorgsintez', 'Tatenergo', 'Elabuga SEZ']
export const manyDeals: Deal[] = [...leadNames.map((company, i): Deal => ({ id: `n${i}`, column: 'new', title: `First call: ${company}`, company })), ...deals]

export const formatAmount = (amount?: number) => (amount === undefined ? 'No amount yet' : `${amount.toLocaleString('ru-RU')} ₽`)

/** A save that never answers: a move or a new card stays on its way, for the page to show. */
export const hold = () => new Promise<void>(() => {})

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const cardIn = (host: HTMLElement, id: string) => host.querySelector<HTMLElement>(`[data-scope="kanban"][data-part="card"][data-card="${id}"]`)
const press = (element: Element | null, key: string) => element?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

/**
 * A state made the way a person makes it, then the page put back as it was:
 * a move takes the focus with it and scrolls to it, which a page opening
 * must not do.
 */
let queue = Promise.resolve()
function quietly(host: HTMLElement, steps: () => Promise<void>) {
  // One at a time: a state made on one board must not take the focus from another's.
  queue = queue.then(async () => {
    if (!host.isConnected) return
    const { scrollX, scrollY } = window
    await steps()
    await frame()
    if (host.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
    window.scrollTo(scrollX, scrollY)
  })
  return queue
}

/** A card picked up by the keyboard, and held. */
export const stageLifted = (host: HTMLElement) => quietly(host, async () => void press(cardIn(host, 'd4'), ' '))

/** A card carried to the next column and dropped: its save is still out. */
export const stagePendingMove = (host: HTMLElement) =>
  quietly(host, async () => {
    press(cardIn(host, 'd4'), ' ')
    await frame()
    press(cardIn(host, 'd4'), 'ArrowRight')
    await frame()
    press(cardIn(host, 'd4'), ' ')
  })

/** A card added to one column and still on its way, and another being typed into the next. */
export const stageAdding = (host: HTMLElement) =>
  quietly(host, async () => {
    const type = async (column: string, title: string) => {
      // Focused first, as a press focuses it: the field open elsewhere closes as the focus leaves it.
      const trigger = host.querySelector<HTMLElement>(`[data-part="add-trigger"][data-column="${column}"]`)
      trigger?.focus({ preventScroll: true })
      trigger?.click()
      await frame()
      const field = host.querySelector<HTMLTextAreaElement>(`[data-part="add-input"]`)
      if (!field) return
      // The prototype's setter, as typing sets it: React keeps its own copy of the value on the element.
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(field, title)
      field.dispatchEvent(new Event('input', { bubbles: true }))
      await frame()
    }
    await type('offer', 'Renewal: Tatneft Retail')
    host.querySelector<HTMLElement>('[data-part="add-submit"]')?.click()
    await frame()
    await type('new', 'First call: Elabuga SEZ')
  })
