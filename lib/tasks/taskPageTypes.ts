import type { Task } from '@/lib/tasks/taskTypes'

export type CategoryFilter =
  | 'all'
  | 'cleaning'
  | 'repair'
  | 'pest'
  | 'paint'
  | 'inspection'
  | 'visit'
  | 'change'
  | 'delivery'
  | 'other'

export type StatusFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'urgent'
  | 'overdue'

export type UndoDeleteState = {
  task: Task
  timeoutId: ReturnType<typeof setTimeout>
} | null
