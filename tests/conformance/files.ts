import type { TreeNode } from '../../packages/core/src/components/tree'

/** The tree in every tree test: a project's files, two levels deep, one of them locked. */
export const files: TreeNode[] = [
  {
    value: 'src',
    label: 'src',
    children: [
      { value: 'src/app', label: 'app', children: [{ value: 'src/app/main.ts', label: 'main.ts' }, { value: 'src/app/routes.ts', label: 'routes.ts' }] },
      { value: 'src/lib', label: 'lib', children: [{ value: 'src/lib/api.ts', label: 'api.ts' }] },
      { value: 'src/index.ts', label: 'index.ts' },
    ],
  },
  { value: 'secrets', label: 'secrets', disabled: true, children: [{ value: 'secrets/key', label: 'key' }] },
  { value: 'tests', label: 'tests', children: [{ value: 'tests/app.test.ts', label: 'app.test.ts' }] },
  { value: 'readme', label: 'README.md' },
]

/** The accordion's sections in every accordion test: one with a description, one disabled. */
export const sections = [
  { value: 'shipping', label: 'Shipping', description: 'Where and how fast' },
  { value: 'returns', label: 'Returns' },
  { value: 'warranty', label: 'Warranty', disabled: true },
  { value: 'payment', label: 'Payment' },
]
