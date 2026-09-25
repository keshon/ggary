import type { FileChangeKind } from '@ggary/core/file-change'

/** A change's files, one of each kind. */
export const changedFiles: { change: FileChangeKind; path: string }[] = [
  { change: 'added', path: 'src/import/leads.ts' },
  { change: 'modified', path: 'src/grid/filters.ts' },
  { change: 'deleted', path: 'src/legacy/csv.ts' },
  { change: 'renamed', path: 'docs/intro.md → docs/start.md' },
  { change: 'conflict', path: 'package.json' },
]
