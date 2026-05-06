import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import {
  summarizeTaskApartments,
  type TaskApartmentInput,
} from '@/lib/tasks/taskApartments'
import type { FollowUpSourceTask } from '@/lib/tasks/followUpHelpers'
import type {
  PestTarget,
  TaskPriority,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

type BaseTaskFormPayload = {
  buildingId: string
  profileId: string
  title: string
  description: string
  category: string
  priority: TaskPriority
  taskDate: string
  taskTime: string
  finalLocation: string
  pestTargets: PestTarget[]
  selectedApartments: TaskApartmentInput[]
}

export type BuiltTaskPayload = ReturnType<typeof buildTaskPayload>

export function buildTaskPayload(params: BaseTaskFormPayload) {
  const {
    buildingId,
    profileId,
    title,
    description,
    category,
    priority,
    taskDate,
    taskTime,
    finalLocation,
    pestTargets,
    selectedApartments,
  } = params

  const apartmentKey =
    finalLocation.trim().length > 0 ? normalizeApartmentKey(finalLocation) : ''

  const pestLocationSummary =
    category === 'pest' ? summarizeTaskApartments(selectedApartments) : null

  return {
    building_id: buildingId,
    created_by: profileId,
    title,
    description: description.trim() || null,
    apartment_or_area:
      category === 'pest' ? pestLocationSummary : finalLocation || null,
    apartment_key:
      category === 'pest'
        ? selectedApartments.length === 1
          ? selectedApartments[0].apartment_key ?? null
          : null
        : apartmentKey || null,
    category,
    priority,
    task_date: taskDate,
    task_time: taskTime || null,
    pest_targets: category === 'pest' ? pestTargets : null,
    treatment_visit_type:
      category === 'pest' && selectedApartments.length === 1
        ? selectedApartments[0].visit_type
        : null,
    pest_treatment_type: null,
    pestLocationSummary,
  }
}

export function buildFollowUpSourceTask(params: {
  taskId: string
  title: string
  description: string
  priority: TaskPriority
  taskDate: string
  taskTime: string
  pestTargets: PestTarget[]
  apartmentOrArea: string | null
}): FollowUpSourceTask {
  return {
    id: params.taskId,
    title: params.title,
    description: params.description.trim() || null,
    apartment_or_area: params.apartmentOrArea,
    apartment_key: null,
    priority: params.priority,
    task_time: params.taskTime || null,
    pest_targets: params.pestTargets,
    treatment_visit_type: 'nuevo',
    task_date: params.taskDate,
  }
}

export function shouldPromptPestFollowUp(params: {
  category: string
  selectedApartments: TaskApartmentInput[]
  previousVisitType?: TreatmentVisitType | null
}) {
  const hasEligibleApartment = params.selectedApartments.some(
    (item) => item.visit_type === 'nuevo' || item.visit_type === 'preventivo'
  )

  if (params.category !== 'pest' || !hasEligibleApartment) {
    return false
  }

  if (typeof params.previousVisitType === 'undefined') {
    return true
  }

  return params.previousVisitType === 'seguimiento'
}
