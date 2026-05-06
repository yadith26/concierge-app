import { supabase } from '@/lib/supabase'
import {
  resolveApartmentKey,
  type PestTarget,
  type VisitType,
} from './warrantyHelpers'
import {
  fetchTaskApartments,
  summarizeTaskApartments,
  type TaskApartmentInput,
} from './taskApartments'

export type FollowUpStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | string

export type FollowUpCandidate = {
  id?: string
  apartment_or_area: string
  apartment_key?: string | null
  pest_target: PestTarget | null
  treatment_visit_type: VisitType | null
  status?: FollowUpStatus | null
  task_date?: string | null
}

export type FollowUpSourceTask = {
  id: string
  title: string
  description: string | null
  apartment_or_area: string | null
  apartment_key?: string | null
  priority: 'high' | 'medium' | 'low'
  task_time?: string | null
  pest_targets?: PestTarget[] | null
  treatment_visit_type?: VisitType | null
  task_date: string
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  const next = new Date(year, (month || 1) - 1, day || 1)
  next.setDate(next.getDate() + days)

  const yyyy = next.getFullYear()
  const mm = String(next.getMonth() + 1).padStart(2, '0')
  const dd = String(next.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

export function isFollowUpVisit(
  visitType: VisitType | null | undefined
) {
  return visitType === 'seguimiento'
}

export function isOpenFollowUpStatus(status?: string | null) {
  return status !== 'completed'
}

export function shouldSuggestFollowUp(
  category: string,
  visitType?: VisitType | '' | null
) {
  return (
    category === 'pest' &&
    (visitType === 'nuevo' || visitType === 'preventivo')
  )
}

export function hasPendingFollowUp(
  items: FollowUpCandidate[],
  apartment: {
    apartment_or_area: string
    apartment_key?: string | null
  },
  pestTarget: PestTarget
) {
  const apartmentKey = resolveApartmentKey(apartment)

  return items.some((item) => {
    if (item.pest_target !== pestTarget) return false
    if (!isFollowUpVisit(item.treatment_visit_type)) return false
    if (!isOpenFollowUpStatus(item.status)) return false

    return resolveApartmentKey(item) === apartmentKey
  })
}

export async function fetchOpenFollowUpsForBuilding(buildingId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, apartment_or_area, apartment_key, pest_targets, treatment_visit_type, status, task_date'
    )
    .eq('building_id', buildingId)
    .eq('category', 'pest')
    .neq('status', 'completed')

  if (error) {
    throw error
  }

  const normalized: FollowUpCandidate[] = []

  for (const row of data || []) {
    const pestTargets = Array.isArray(row.pest_targets) ? row.pest_targets : []

    for (const pestTarget of pestTargets) {
      normalized.push({
        id: row.id,
        apartment_or_area: row.apartment_or_area || '',
        apartment_key: row.apartment_key || null,
        pest_target: pestTarget as PestTarget,
        treatment_visit_type: row.treatment_visit_type as VisitType | null,
        status: row.status || null,
        task_date: row.task_date || null,
      })
    }
  }

  return normalized
}

export async function createFollowUpTask({
  sourceTask,
  buildingId,
  profileId,
}: {
  sourceTask: FollowUpSourceTask
  buildingId: string
  profileId: string
}) {
  const sourceApartments = await fetchTaskApartments(sourceTask.id)

  let followUpApartments: TaskApartmentInput[] = []

  if (sourceApartments.length > 0) {
    followUpApartments = sourceApartments
      .filter(
        (item) =>
          item.visit_type === 'nuevo' || item.visit_type === 'preventivo'
      )
      .map((item) => ({
        apartment_or_area: item.apartment_or_area,
        apartment_key: item.apartment_key ?? null,
        visit_type: 'seguimiento',
      }))
  } else if (sourceTask.apartment_or_area) {
    if (
      sourceTask.treatment_visit_type === 'nuevo' ||
      sourceTask.treatment_visit_type === 'preventivo'
    ) {
      followUpApartments = [
        {
          apartment_or_area: sourceTask.apartment_or_area,
          apartment_key: sourceTask.apartment_key ?? null,
          visit_type: 'seguimiento',
        },
      ]
    }
  }

  if (!followUpApartments.length) {
    return null
  }

  const existingTasks = await fetchOpenFollowUpsForBuilding(buildingId)
  const pestTargets = Array.isArray(sourceTask.pest_targets)
    ? sourceTask.pest_targets
    : []

  for (const apartment of followUpApartments) {
    for (const pestTarget of pestTargets) {
      const alreadyExists = hasPendingFollowUp(existingTasks, apartment, pestTarget)
      if (alreadyExists) {
        throw new Error(
          'Ya existe un seguimiento pendiente para este tratamiento'
        )
      }
    }
  }

  const followUpDate = addDays(sourceTask.task_date, 15)
  const apartmentSummary = summarizeTaskApartments(followUpApartments)

  const followUpTitle = sourceTask.title.toLowerCase().includes('seguimiento')
    ? sourceTask.title
    : `Seguimiento - ${sourceTask.title}`

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      building_id: buildingId,
      created_by: profileId,
      title: followUpTitle,
      description: sourceTask.description?.trim() || null,
      apartment_or_area: apartmentSummary || null,
      apartment_key:
        followUpApartments.length === 1
          ? followUpApartments[0].apartment_key?.trim() || null
          : null,
      category: 'pest',
      priority: sourceTask.priority,
      status: 'pending',
      task_date: followUpDate,
      task_time: sourceTask.task_time || null,
      pest_targets: pestTargets,
      treatment_visit_type:
        followUpApartments.length === 1 ? 'seguimiento' : null,
      pest_treatment_type: null,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw error || new Error('No se pudo crear la tarea de seguimiento')
  }

  const rows = followUpApartments.map((item) => ({
    task_id: data.id,
    apartment_or_area: item.apartment_or_area.trim(),
    apartment_key: item.apartment_key?.trim() || null,
    visit_type: 'seguimiento',
  }))

  const { error: apartmentsError } = await supabase
    .from('task_apartments')
    .insert(rows)

  if (apartmentsError) {
    throw apartmentsError
  }

  return data
}