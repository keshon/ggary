import type { KanbanCard, KanbanColumn } from '../../packages/core/src/components/kanban'

/** The board in every kanban test: three columns, one empty, one with a limit it already meets. */
export const columns: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing', limit: 2 },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
]

export interface Task extends KanbanCard {
  owner?: string
}

export const tasks: Task[] = [
  { id: 'a', column: 'todo', title: 'Call Aigul', owner: 'IS' },
  { id: 'b', column: 'todo', title: 'Send the offer' },
  { id: 'c', column: 'todo', title: 'Book the demo' },
  { id: 'd', column: 'doing', title: 'Fix the import' },
  { id: 'e', column: 'doing', title: 'Write the contract' },
  { id: 'f', column: 'done', title: 'Kickoff' },
]
