import type {
  PestTarget,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

export function getPestTargetKey(type: PestTarget) {
  if (type === 'cucarachas') return 'pestTarget.cucarachas'
  if (type === 'roedores') return 'pestTarget.roedores'
  return 'pestTarget.chinches'
}

export function getVisitTypeKey(type: TreatmentVisitType) {
  if (type === 'nuevo') return 'visitType.nuevo'
  if (type === 'seguimiento') return 'visitType.seguimiento'
  return 'visitType.preventivo'
}

export function getSmartCategoryKey(category: TaskCategory) {
  if (category === 'cleaning') return 'category.cleaning'
  if (category === 'repair') return 'category.repair'
  if (category === 'pest') return 'category.pest'
  if (category === 'paint') return 'category.paint'
  if (category === 'inspection') return 'category.inspection'
  if (category === 'visit') return 'category.visit'
  if (category === 'change') return 'category.change'
  if (category === 'delivery') return 'category.delivery'
  return 'category.other'
}

export function getSmartPriorityKey(priority: TaskPriority) {
  if (priority === 'high') return 'priority.high'
  if (priority === 'medium') return 'priority.medium'
  return 'priority.low'
}

export function getPriorityKey(priority: TaskPriority) {
  if (priority === 'high') return 'priority.high'
  if (priority === 'medium') return 'priority.medium'
  return 'priority.low'
}

export function getStatusKey(status: TaskStatus) {
  if (status === 'completed') return 'status.completed'
  if (status === 'in_progress') return 'status.in_progress'
  return 'status.pending'
}

export function getCategoryKey(category: TaskCategory) {
  if (category === 'cleaning') return 'category.cleaning'
  if (category === 'repair') return 'category.repair'
  if (category === 'pest') return 'category.pest'
  if (category === 'paint') return 'category.paint'
  if (category === 'visit') return 'category.visit'
  if (category === 'change') return 'category.change'
  if (category === 'delivery') return 'category.delivery'
  if (category === 'inspection') return 'category.inspection'
  return 'category.other'
}

function formatDate(date: string, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, options).format(
    new Date(`${date}T12:00:00`)
  )
}

export function formatDateLong(date: string, locale: string) {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTaskDate(date: string, locale: string) {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'short',
  })
}

export function formatTaskDateLong(date: string, locale: string) {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
