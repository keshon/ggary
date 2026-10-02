/** What the table demos share: a pipeline of deals, and the columns over it. */
import type { TableColumnDef } from '@ggary/core/table'

export interface Deal {
  company: string
  owner: string
  value: number
  stage: 'New' | 'In talks' | 'Offer sent' | 'Won'
  updated: string
}

export const deals: Deal[] = [
  { company: 'Acme Labs', owner: 'Anna Petrova', value: 48000, stage: 'In talks', updated: '2026-09-28' },
  { company: 'Borealis Group', owner: 'Mark Chen', value: 120000, stage: 'Offer sent', updated: '2026-09-25' },
  { company: 'Cobalt Works', owner: 'Leila Haddad', value: 9500, stage: 'New', updated: '2026-09-30' },
  { company: 'Delta Retail', owner: 'Tom Øberg', value: 73000, stage: 'Won', updated: '2026-09-18' },
  { company: 'Ember Studio', owner: 'Priya Nair', value: 21000, stage: 'In talks', updated: '2026-09-21' },
  { company: 'Fjord Logistics', owner: 'Jonas Weber', value: 54000, stage: 'New', updated: '2026-09-27' },
  { company: 'Granite Holding', owner: 'Daria Morozova', value: 310000, stage: 'Offer sent', updated: '2026-09-12' },
]

export const dealColumns: TableColumnDef<Deal>[] = [
  { id: 'company', header: 'Company' },
  { id: 'owner', header: 'Owner' },
  { id: 'value', header: 'Value' },
  { id: 'stage', header: 'Stage' },
  { id: 'updated', header: 'Updated' },
  { id: 'actions', header: '', value: () => null, sortable: false },
]
