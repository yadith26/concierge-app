import type {
  PestTarget,
  TaskCategory,
} from '@/lib/tasks/taskTypes'

import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type ValidateTaskFormParams = {
  title: string
  cleanedTitle?: string | null
  taskDate: string
  today: string
  buildingId: string
  profileId: string
  category: TaskCategory | ''
  pestTargets: PestTarget[]
  selectedApartments: TaskApartmentInput[] // 🔥 IMPORTANTE
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
}: ValidateTaskFormParams): ValidateTaskFormResult {
  const finalTitle = cleanedTitle?.trim() || title.trim()

  if (!finalTitle) {
    return {
      ok: false,
      message: 'El título es obligatorio.',
    }
  }

  if (!taskDate) {
    return {
      ok: false,
      message: 'La fecha es obligatoria.',
    }
  }

  if (taskDate < today) {
    return {
      ok: false,
      message: 'La fecha no puede ser anterior a hoy.',
    }
  }

  if (!buildingId || !profileId) {
    return {
      ok: false,
      message: 'Falta información del usuario o edificio.',
    }
  }

  if (!category) {
    return {
      ok: false,
      message: 'Debes seleccionar una categoria.',
    }
  }

  if (category === 'pest' && pestTargets.length === 0) {
    return {
      ok: false,
      message: 'Debes seleccionar al menos una plaga.',
    }
  }

  if (category === 'pest' && selectedApartments.length === 0) {
    return {
      ok: false,
      message: 'Debes agregar al menos un apartamento.',
    }
  }

  return {
    ok: true,
    finalTitle,
  }
}
