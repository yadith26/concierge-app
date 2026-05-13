import { supabase } from '@/lib/supabase'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'
import type { PestTarget } from '@/lib/tasks/taskTypes'

type DuplicatePestTaskCheckParams = {
  buildingId: string
  taskDate: string
  selectedApartments: TaskApartmentInput[]
  excludeTaskId?: string | null
}

type OpenPestCycleCheckParams = {
  buildingId: string
  selectedApartments: TaskApartmentInput[]
  pestTargets: PestTarget[]
  excludeTaskId?: string | null
}

export async function findDuplicatePestApartmentsForDate({
  buildingId,
  taskDate,
  selectedApartments,
  excludeTaskId = null,
}: DuplicatePestTaskCheckParams) {
  const apartmentKeys = selectedApartments
    .map((item) => item.apartment_key || normalizeApartmentKey(item.apartment_or_area))
    .filter(Boolean)

  if (apartmentKeys.length === 0) {
    return []
  }

  let query = supabase
    .from('tasks')
    .select(
      `id, apartment_or_area, apartment_key, task_apartments (apartment_or_area, apartment_key)`
    )
    .eq('building_id', buildingId)
    .eq('category', 'pest')
    .eq('task_date', taskDate)
    .neq('status', 'completed')

  if (excludeTaskId) {
    query = query.neq('id', excludeTaskId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const duplicates = new Set<string>()

  for (const row of data || []) {
    const rowApartments = Array.isArray(row.task_apartments)
      ? row.task_apartments
      : row.apartment_or_area
        ? [
            {
              apartment_or_area: row.apartment_or_area,
              apartment_key: row.apartment_key || null,
            },
          ]
        : []

    for (const apartment of rowApartments) {
      const key =
        apartment.apartment_key ||
        normalizeApartmentKey(apartment.apartment_or_area || '')

      if (key && apartmentKeys.includes(key)) {
        duplicates.add(apartment.apartment_or_area)
      }
    }
  }

  return Array.from(duplicates)
}

export async function findOpenPestCycleConflicts({
  buildingId,
  selectedApartments,
  pestTargets,
  excludeTaskId = null,
}: OpenPestCycleCheckParams) {
  const apartmentKeys = selectedApartments
    .map((item) => item.apartment_key || normalizeApartmentKey(item.apartment_or_area))
    .filter(Boolean)

  if (apartmentKeys.length === 0 || pestTargets.length === 0) {
    return []
  }

  let query = supabase
    .from('tasks')
    .select(
      `id, apartment_or_area, apartment_key, pest_targets, task_apartments (apartment_or_area, apartment_key)`
    )
    .eq('building_id', buildingId)
    .eq('category', 'pest')
    .neq('status', 'completed')

  if (excludeTaskId) {
    query = query.neq('id', excludeTaskId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const conflicts = new Set<string>()

  for (const row of data || []) {
    const rowPestTargets = Array.isArray(row.pest_targets)
      ? (row.pest_targets as PestTarget[])
      : []

    const sharesPest = rowPestTargets.some((target) => pestTargets.includes(target))
    if (!sharesPest) continue

    const rowApartments = Array.isArray(row.task_apartments)
      ? row.task_apartments
      : row.apartment_or_area
        ? [
            {
              apartment_or_area: row.apartment_or_area,
              apartment_key: row.apartment_key || null,
            },
          ]
        : []

    for (const apartment of rowApartments) {
      const key =
        apartment.apartment_key ||
        normalizeApartmentKey(apartment.apartment_or_area || '')

      if (key && apartmentKeys.includes(key)) {
        conflicts.add(apartment.apartment_or_area)
      }
    }
  }

  return Array.from(conflicts)
}
