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
  follow_up_source_task_id?: string | null
  pest_target: PestTarget | null
  treatment_visit_type: VisitType | null
  status?: FollowUpStatus | null
  task_date?: string | null
  task_time?: string | null
  apartment_count?: number
}

export type ExistingFollowUpDecisionItem = {
  taskId: string
  apartment_or_area: string
  followUpSourceTaskId?: string | null
  currentDate: string
  currentTime?: string | null
  suggestedDate: string
  suggestedTime?: string | null
  canReprogram: boolean
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

export type CreateFollowUpTaskResult =
  | {
      status: 'created'
      taskIds: string[]
      createdApartments: string[]
      existingFollowUps?: ExistingFollowUpDecisionItem[]
    }
  | {
      status: 'skipped'
      reason: 'no_follow_up_targets' | 'already_exists'
      existingFollowUps?: ExistingFollowUpDecisionItem[]
    }

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  const next = new Date(year, (month || 1) - 1, day || 1)
  next.setDate(next.getDate() + days)

  return formatDateParts(next)
}

function formatDateParts(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function moveWeekendToMonday(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  const next = new Date(year, (month || 1) - 1, day || 1)
  const weekDay = next.getDay()

  if (weekDay === 6) {
    next.setDate(next.getDate() + 2)
  } else if (weekDay === 0) {
    next.setDate(next.getDate() + 1)
  }

  return formatDateParts(next)
}

export function getSuggestedFollowUpDate(baseDate: string) {
  return moveWeekendToMonday(addDays(baseDate, 15))
}

export function normalizeFollowUpBusinessDate(dateString: string) {
  return moveWeekendToMonday(dateString)
}

function getLaterDate(dateA: string, dateB: string) {
  return dateA >= dateB ? dateA : dateB
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

export async function fetchOpenFollowUpsForBuilding(buildingId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      `id, apartment_or_area, apartment_key, follow_up_source_task_id, pest_targets, treatment_visit_type, status, task_date, task_time,
       task_apartments (apartment_or_area, apartment_key, visit_type)`
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
    const taskApartments = Array.isArray(row.task_apartments)
      ? row.task_apartments
      : []

    const apartmentEntries =
      taskApartments.length > 0
        ? taskApartments.filter((item) => item.visit_type === 'seguimiento')
        : [
            {
              apartment_or_area: row.apartment_or_area || '',
              apartment_key: row.apartment_key || null,
              visit_type: row.treatment_visit_type || null,
            },
          ]

    for (const apartmentEntry of apartmentEntries) {
      for (const pestTarget of pestTargets) {
        normalized.push({
          id: row.id,
          apartment_or_area: apartmentEntry.apartment_or_area || '',
          apartment_key: apartmentEntry.apartment_key || null,
          follow_up_source_task_id: row.follow_up_source_task_id || null,
          pest_target: pestTarget as PestTarget,
          treatment_visit_type:
            apartmentEntry.visit_type as VisitType | null,
          status: row.status || null,
          task_date: row.task_date || null,
          task_time: row.task_time || null,
          apartment_count: apartmentEntries.length,
        })
      }
    }
  }

  return normalized
}

async function fetchSourceTaskDates(sourceTaskIds: string[]) {
  if (sourceTaskIds.length === 0) return new Map<string, string>()

  const { data, error } = await supabase
    .from('tasks')
    .select('id, task_date')
    .in('id', sourceTaskIds)

  if (error) {
    throw error
  }

  return new Map<string, string>(
    (data || [])
      .filter((item) => item?.id && item?.task_date)
      .map((item) => [item.id as string, item.task_date as string])
  )
}

export async function findExistingFollowUpDecisionItems({
  buildingId,
  apartments,
  pestTargets,
  suggestedDate,
  suggestedTime = null,
}: {
  buildingId: string
  apartments: Array<{
    apartment_or_area: string
    apartment_key?: string | null
  }>
  pestTargets: PestTarget[]
  suggestedDate: string
  suggestedTime?: string | null
}) {
  if (apartments.length === 0 || pestTargets.length === 0) {
    return []
  }

  const existingTasks = await fetchOpenFollowUpsForBuilding(buildingId)
  const sourceTaskIds = Array.from(
    new Set(
      existingTasks
        .map((item) => item.follow_up_source_task_id)
        .filter((value): value is string => Boolean(value))
    )
  )
  const sourceDateMap = await fetchSourceTaskDates(sourceTaskIds)
  const decisionItems: ExistingFollowUpDecisionItem[] = []

  for (const apartment of apartments) {
    const existingFollowUp = getExistingOpenFollowUpForApartment(
      existingTasks,
      apartment,
      pestTargets
    )

    if (!existingFollowUp?.id || !existingFollowUp.task_date) continue

    const normalizedSuggestedDate = normalizeFollowUpBusinessDate(suggestedDate)
    const minimumDateFromSource = existingFollowUp.follow_up_source_task_id
      ? sourceDateMap.get(existingFollowUp.follow_up_source_task_id)
      : null
    const minimumAllowedDate = minimumDateFromSource
      ? getSuggestedFollowUpDate(minimumDateFromSource)
      : existingFollowUp.task_date
    const finalSuggestedDate = getLaterDate(
      normalizedSuggestedDate,
      minimumAllowedDate
    )

    decisionItems.push({
      taskId: existingFollowUp.id,
      apartment_or_area: apartment.apartment_or_area,
      followUpSourceTaskId: existingFollowUp.follow_up_source_task_id || null,
      currentDate: existingFollowUp.task_date,
      currentTime: existingFollowUp.task_time || null,
      suggestedDate: finalSuggestedDate,
      suggestedTime: suggestedTime || existingFollowUp.task_time || null,
      canReprogram:
        (!existingFollowUp.apartment_count ||
          existingFollowUp.apartment_count <= 1) &&
        existingFollowUp.task_date !== finalSuggestedDate,
    })
  }

  return decisionItems
}

function getExistingOpenFollowUpForApartment(
  items: FollowUpCandidate[],
  apartment: {
    apartment_or_area: string
    apartment_key?: string | null
  },
  pestTargets: PestTarget[]
) {
  const apartmentKey = resolveApartmentKey(apartment)

  return items.find((item) => {
    if (!item.id) return false
    if (!item.pest_target || !pestTargets.includes(item.pest_target)) return false
    if (!isFollowUpVisit(item.treatment_visit_type)) return false
    if (!isOpenFollowUpStatus(item.status)) return false

    return resolveApartmentKey(item) === apartmentKey
  })
}

export async function reprogramExistingFollowUps({
  items,
}: {
  items: ExistingFollowUpDecisionItem[]
}) {
  for (const item of items) {
    if (!item.canReprogram) continue

    const normalizedSuggestedDate = normalizeFollowUpBusinessDate(
      item.suggestedDate
    )

    const { error } = await supabase
      .from('tasks')
      .update({
        task_date: normalizedSuggestedDate,
        task_time: item.suggestedTime || item.currentTime || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.taskId)

    if (error) {
      throw error
    }
  }

  return items.filter((item) => item.canReprogram).map((item) => item.apartment_or_area)
}

export async function createFollowUpTask({
  sourceTask,
  buildingId,
  profileId,
}: {
  sourceTask: FollowUpSourceTask
  buildingId: string
  profileId: string
}): Promise<CreateFollowUpTaskResult> {
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
    return {
      status: 'skipped',
      reason: 'no_follow_up_targets',
    }
  }

  const existingTasks = await fetchOpenFollowUpsForBuilding(buildingId)
  const pestTargets = Array.isArray(sourceTask.pest_targets)
    ? sourceTask.pest_targets
    : []
  const followUpDate = getSuggestedFollowUpDate(sourceTask.task_date)
  const createdTaskIds: string[] = []
  const createdApartments: string[] = []
  const existingFollowUps: ExistingFollowUpDecisionItem[] = []

  for (const apartment of followUpApartments) {
    const existingFollowUp = getExistingOpenFollowUpForApartment(
      existingTasks,
      apartment,
      pestTargets
    )

    if (existingFollowUp?.id) {
      if (existingFollowUp.task_date) {
        existingFollowUps.push({
          taskId: existingFollowUp.id,
          apartment_or_area: apartment.apartment_or_area,
          followUpSourceTaskId: existingFollowUp.follow_up_source_task_id || null,
          currentDate: existingFollowUp.task_date,
          currentTime: existingFollowUp.task_time || null,
          suggestedDate: followUpDate,
          suggestedTime: sourceTask.task_time || existingFollowUp.task_time || null,
          canReprogram:
            (!existingFollowUp.apartment_count ||
              existingFollowUp.apartment_count <= 1) &&
            existingFollowUp.task_date < followUpDate,
        })
      }

      continue
    }

    const followUpTitle = sourceTask.title.toLowerCase().includes('seguimiento')
      ? sourceTask.title
      : `Follow-up - ${sourceTask.title}`

    const apartmentSummary = summarizeTaskApartments([apartment])

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        building_id: buildingId,
        created_by: profileId,
        title: followUpTitle,
        description: sourceTask.description?.trim() || null,
        apartment_or_area: apartmentSummary || null,
        apartment_key: apartment.apartment_key?.trim() || null,
        category: 'pest',
        priority: sourceTask.priority,
        status: 'pending',
        task_date: followUpDate,
        task_time: sourceTask.task_time || null,
        pest_targets: pestTargets,
        treatment_visit_type: 'seguimiento',
        pest_treatment_type: null,
        follow_up_source_task_id: sourceTask.id,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw error || new Error('Could not create the follow-up task')
    }

    const { error: apartmentsError } = await supabase
      .from('task_apartments')
      .insert({
        task_id: data.id,
        apartment_or_area: apartment.apartment_or_area.trim(),
        apartment_key: apartment.apartment_key?.trim() || null,
        visit_type: 'seguimiento',
      })

    if (apartmentsError) {
      throw apartmentsError
    }

    createdTaskIds.push(data.id)
    createdApartments.push(apartment.apartment_or_area)
  }

  if (
    createdTaskIds.length === 0 &&
    existingFollowUps.length === 0
  ) {
    return {
      status: 'skipped',
      reason: 'no_follow_up_targets',
    }
  }

  if (createdTaskIds.length === 0 && existingFollowUps.length > 0) {
    return {
      status: 'skipped',
      reason: 'already_exists',
      existingFollowUps,
    }
  }

  return {
    status: 'created',
    taskIds: createdTaskIds,
    createdApartments,
    existingFollowUps:
      existingFollowUps.length > 0 ? existingFollowUps : undefined,
  }
}
