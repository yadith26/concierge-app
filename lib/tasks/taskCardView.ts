import type { Task } from '@/lib/tasks/taskTypes'
import { getCategoryMeta, getSoonLabel } from '@/lib/tasks/taskCardHelpers'

type TFunction = (key: string, values?: Record<string, unknown>) => string

export function getTaskCardViewModel(task: Task, t?: TFunction) {
  const isUrgent = task.priority === 'high' && task.status !== 'completed'
  const isFromManagerEvent = !!task.source_request_id
  const hasPhotos = (task.task_photos?.length || 0) > 0
  const hasNote = !!task.description?.trim()

  const pestTargets = Array.isArray(task.pest_targets) ? task.pest_targets : []
  const taskApartments = Array.isArray(task.task_apartments)
    ? task.task_apartments
    : []

  const apartmentSummary =
    taskApartments.length > 0
      ? taskApartments.map((item) => item.apartment_or_area).join(', ')
      : task.apartment_or_area || null

  const apartmentCount = taskApartments.length

  const initialCount = taskApartments.filter(
    (item) => item.visit_type === 'nuevo'
  ).length

  const followUpCount = taskApartments.filter(
    (item) => item.visit_type === 'seguimiento'
  ).length

  const preventiveCount = taskApartments.filter(
    (item) => item.visit_type === 'preventivo'
  ).length

  const priorityBar =
    task.priority === 'high'
      ? 'bg-[#FFB8BF]'
      : task.priority === 'medium'
        ? 'bg-[#F2C94C]'
        : 'bg-[#DCE5F0]'

  const badgeClass =
    task.status === 'completed'
      ? 'border border-[#CDECD9] bg-[#F1FBF5] text-[#14804A]'
      : task.status === 'in_progress'
        ? 'border border-[#D7E5FB] bg-[#F2F7FF] text-[#2F66C8]'
        : 'border border-[#F0D9DD] bg-[#FFF7F8] text-[#D64555]'

  const categoryMeta = getCategoryMeta(task.category, t)
  const soonLabel = getSoonLabel(task, t)

  return {
    isUrgent,
    isFromManagerEvent,
    hasPhotos,
    hasNote,
    pestTargets,
    taskApartments,
    apartmentSummary,
    apartmentCount,
    initialCount,
    followUpCount,
    preventiveCount,
    priorityBar,
    badgeClass,
    categoryMeta,
    soonLabel,
  }
}
