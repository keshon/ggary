/** What the pickers and the form share: a deal's stages, the companies a server finds, and the days no call is booked. */
import type { ComboboxItem } from '@ggary/core/combobox'
import type { SelectItem } from '@ggary/core/select'

/** A deal's stages, for Select and the new deal form. */
export const stages: SelectItem[] = [
  { value: 'new', label: 'New' },
  { value: 'talks', label: 'In talks' },
  { value: 'offer', label: 'Offer sent' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost (disabled)', disabled: true },
]

/** The companies a lead can belong to. */
export const companies: ComboboxItem[] = [
  { value: 'acme', label: 'Acme Labs', description: 'Anna Petrova · lead 214' },
  { value: 'borealis', label: 'Borealis Group', description: 'Mark Chen · lead 77' },
  { value: 'cobalt', label: 'Cobalt Works', description: 'Leila Haddad · lead 902' },
  { value: 'delta', label: 'Delta Retail', description: 'Tom Øberg · lead 18' },
  { value: 'ember', label: 'Ember Studio', description: 'Priya Nair · lead 450' },
  { value: 'fjord', label: 'Fjord Logistics', description: 'Jonas Weber · lead 33' },
  { value: 'granite', label: 'Granite Holding', description: 'Daria Morozova · lead 610' },
]

/** The companies as a server would search them: a moment later, the ones whose name starts with the query. */
export function searchCompanies(query: string, signal: AbortSignal): Promise<{ items: ComboboxItem[]; total: number }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const needle = query.trim().toLowerCase()
      const items = companies.filter((company) => company.label.toLowerCase().startsWith(needle))
      resolve({ items, total: items.length })
    }, 250)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

/** Saturdays and Sundays: no calls booked. */
export const isWeekend = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}
