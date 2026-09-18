import type { CascaderNode } from '../../packages/core/src/components/cascader'

/** The cascader's tree in every test: three levels, a disabled city, a leaf at the root. */
export const places: CascaderNode[] = [
  {
    value: 'ru',
    label: 'Russia',
    children: [
      { value: 'msk', label: 'Moscow' },
      {
        value: 'tat',
        label: 'Tatarstan',
        children: [
          { value: 'kzn', label: 'Kazan' },
          { value: 'chelny', label: 'Naberezhnye Chelny' },
        ],
      },
      { value: 'spb', label: 'Saint Petersburg', disabled: true },
      { value: 'sam', label: 'Samara' },
    ],
  },
  { value: 'kz', label: 'Kazakhstan', children: [{ value: 'ala', label: 'Almaty' }] },
  { value: 'by', label: 'Belarus' },
]
