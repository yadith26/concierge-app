import type { PestTarget, TaskCategory } from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type TFunction = (key: string) => string

type ValidateTaskFormParams = {
  title: string
  cleanedTitle?: string | null
  taskDate: string
  today: string
  buildingId: string
  profileId: string
  category: TaskCategory | ''
  pestTargets: PestTarget[]
  selectedApartments: TaskApartmentInput[]
  t?: TFunction
}

type ValidateTaskFormResult =
  | {
      ok: true
      finalTitle: string
    }
  | {
      ok: false
      message: string
    }

export function validateTaskForm({
  title,
  cleanedTitle,
  taskDate,
  today,
  buildingId,
  profileId,
  category,
  pestTargets,
  selectedApartments,
  t,
}: ValidateTaskFormParams): ValidateTaskFormResult {
  const finalTitle = cleanedTitle?.trim() || title.trim()

  if (!finalTitle) {
    return {
      ok: false,
      message: t?.('titleRequired') || 'Title is required.',
    }
  }

  if (!taskDate) {
    return {
      ok: false,
      message: t?.('dateRequired') || 'Date is required.',
    }
  }

  if (taskDate < today) {
    return {
      ok: false,
      message: t?.('dateBeforeToday') || 'Date cannot be earlier than today.',
    }
  }

  if (!buildingId || !profileId) {
    return {
      ok: false,
      message:
        t?.('missingUserOrBuilding') ||
        'User or building information is missing.',
    }
  }

  if (!category) {
    return {
      ok: false,
      message: t?.('categoryRequired') || 'You must select a category.',
    }
  }

  if (category === 'pest' && pestTargets.length === 0) {
    return {
      ok: false,
      message: t?.('pestRequired') || 'You must select at least one pest.',
    }
  }

  if (category === 'pest' && selectedApartments.length === 0) {
    return {
      ok: false,
      message:
        t?.('apartmentRequired') ||
        'You must add at least one apartment.',
    }
  }

  return {
    ok: true,
    finalTitle,
  }
}
