import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'
import type { TaskCategory, TaskPriority } from '@/lib/tasks/taskTypes'

export type OwnerRequestItem = {
  id: string
  title: string
  description: string | null
  suggested_date: string | null
  apartment_or_area: string | null
  category_suggestion: TaskCategory | null
  status: 'pending' | 'viewed' | 'converted' | 'closed'
  created_at: string
}

export type OwnerRequestTaskDraft = {
  title: string
  description: string | null
  apartment_or_area: string | null
  category: TaskCategory
  priority: TaskPriority
  task_date: string
  task_apartments?: TaskApartmentInput[]
}

export const OWNER_REQUEST_SELECT_FIELDS =
  'id, title, description, suggested_date, apartment_or_area, category_suggestion, status, created_at'

export function getUnreadRequestCount(requests: OwnerRequestItem[]) {
  return requests.filter((request) => request.status === 'pending').length
}

export function toOwnerRequestTaskDraft(
  request: OwnerRequestItem
): OwnerRequestTaskDraft {
  const category = request.category_suggestion || 'visit'
  const apartmentOrArea = request.apartment_or_area?.trim() || null
  const apartmentKey = apartmentOrArea ? normalizeApartmentKey(apartmentOrArea) : ''

  return {
    title: request.title,
    description: request.description,
    apartment_or_area: apartmentOrArea,
    category,
    priority: 'medium',
    task_date: request.suggested_date || '',
    task_apartments:
      category === 'pest' && apartmentOrArea
        ? [
            {
              apartment_or_area: apartmentOrArea,
              apartment_key: apartmentKey || null,
              visit_type: 'nuevo',
            },
          ]
        : undefined,
  }
}
