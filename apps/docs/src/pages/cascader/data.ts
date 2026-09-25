import type { CascaderNode } from '@ggary/core/cascader'

/** Where a lead is: country, region, city. */
export const regions: CascaderNode[] = [
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
export const teams: CascaderNode[] = [
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
