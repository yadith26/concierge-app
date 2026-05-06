import type { AgendaTask } from '@/components/agenda/AgendaTypes'
import type { TaskCategory } from '@/lib/tasks/taskTypes'

export type BuildingSummary = {
  id: string
  name: string
  address: string | null
}

export type OwnerRequestRow = {
  id: string
  title: string
  description: string | null
  suggested_date: string | null
  apartment_or_area: string | null
  category_suggestion: TaskCategory | null
  status: 'pending' | 'viewed' | 'converted' | 'closed'
  created_at: string
}

export type AgendaEntry = AgendaTask & {
  entryType: 'task' | 'event'
  requestStatus?: OwnerRequestRow['status']
}

export type TFunction = (key: string, values?: Record<string, unknown>) => string