/** A project's boards and columns, as a sidebar shows them. */
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
  { value: 'wiki', label: 'Wiki' },
]

/** The same boards with HR, which this person may not open. */
export const withLocked = [
  ...projectTree.slice(0, 2),
  { value: 'hr', label: 'HR', disabled: true, children: [{ value: 'hr/hiring', label: 'Hiring' }] },
  { value: 'archive', label: 'Archive', disabled: true },
  ...projectTree.slice(2),
]

export const openBranches = ['sales', 'sales/leads']
