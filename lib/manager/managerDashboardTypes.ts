import type { Task } from '@/lib/tasks/taskTypes'

export type BuildingSummary = {
  id: string
  name: string
  address: string | null
  invite_code: string | null
  concierge_id: string | null
}

export type ManagerBuildingUnitSummary = {
  available: number
  expiringSoon: number
  garages: number
  occupied: number
  previewUnits: Array<{
    lease_end: string | null
    status: 'occupied' | 'available' | 'expiring_soon' | 'problematic' | 'inactive'
    tenant_name: string | null
    unit_key: string
    unit_label: string
  }>
  problematic: number
  storages: number
  totalApartments: number
}

export type ConciergeSummary = {
  avatar_key: string | null
  id: string
  name: string
  profile_photo_url: string | null
}

export type TaskFilter =
  | 'all'
  | 'today'
  | 'pending'
  | 'overdue'
  | 'upcoming'
  | 'urgent'
  | 'completed'

export type OwnerRequestSummary = {
  id: string
  title: string
  description: string | null
  suggested_date: string | null
  apartment_or_area: string | null
  category_suggestion: string | null
  status: 'pending' | 'viewed' | 'converted' | 'closed'
  created_at: string
}

export type ManagerTaskSummary = {
  monthTasks: Task[]
  pendingTasks: Task[]
  overdueTasks: Task[]
  todayTasks: Task[]
  upcomingTasks: Task[]
  urgentTasks: Task[]
  completedTasks: Task[]
}

export type ManagerEventSummary = {
  pending: OwnerRequestSummary[]
  viewed: OwnerRequestSummary[]
  converted: OwnerRequestSummary[]
  closed: OwnerRequestSummary[]
  recent: OwnerRequestSummary[]
}
