import { supabase } from '@/lib/supabase'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import type { TaskApartment, TreatmentVisitType } from '@/lib/tasks/taskTypes'

export type TaskApartmentInput = {
  apartment_or_area: string
  apartment_key: string | null
  visit_type: TreatmentVisitType
}

export function buildTaskApartmentInput(
  apartmentOrArea: string,
  visitType: TreatmentVisitType
): TaskApartmentInput {
  const cleanValue = apartmentOrArea.trim()

  return {
    apartment_or_area: cleanValue,
    apartment_key: cleanValue ? normalizeApartmentKey(cleanValue) : null,
    visit_type: visitType,
  }
}

export function summarizeTaskApartments(
  apartments: Array<TaskApartmentInput | TaskApartment>
) {
  return apartments
    .map((item) => item.apartment_or_area.trim())
    .filter(Boolean)
    .join(', ')
}

export async function fetchTaskApartments(taskId: string) {
  const { data, error } = await supabase
    .from('task_apartments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []) as TaskApartment[]
}

export async function replaceTaskApartments(
  taskId: string,
  apartments: TaskApartmentInput[]
) {
  const { error: deleteError } = await supabase
    .from('task_apartments')
    .delete()
    .eq('task_id', taskId)

  if (deleteError) {
    throw deleteError
  }

  if (!apartments.length) return

  const rows = apartments.map((item) => ({
    task_id: taskId,
    apartment_or_area: item.apartment_or_area.trim(),
    apartment_key: item.apartment_key ?? null,
    visit_type: item.visit_type,
  }))

  const { error: insertError } = await supabase
    .from('task_apartments')
    .insert(rows)

  if (insertError) {
    throw insertError
  }
}
