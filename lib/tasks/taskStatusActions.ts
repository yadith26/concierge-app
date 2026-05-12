import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/tasks/taskTypes'
import { fetchTaskApartments } from '@/lib/tasks/taskApartments'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'
import {
  recordCompletedTaskInUnitHistory,
  recordPestTreatmentsInUnitHistory,
} from '@/lib/unit-history/unitHistoryService'
import { recordTaskStatusHistory } from '@/lib/tasks/taskStatusHistory'

type UpdateTaskStatusParams = {
  task: Task
  nextStatus: 'pending' | 'in_progress' | 'completed'
  buildingId: string
  profileId: string
  reason?: string | null
}

function logAndThrow(step: string, error: unknown): never {
  console.error(`Error en ${step}:`, error)

  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }

    throw new Error(
      [
        maybeError.message || `Error en ${step}`,
        maybeError.details || '',
        maybeError.hint || '',
        maybeError.code ? `Codigo: ${maybeError.code}` : '',
      ]
        .filter(Boolean)
        .join(' | ')
    )
  }

  throw new Error(`Error en ${step}`)
}

export async function updateTaskStatusWithTreatment({
  task,
  nextStatus,
  buildingId,
  profileId,
  reason,
}: UpdateTaskStatusParams) {
  const previousStatus = task.status

  const updatePayload: {
    status: 'pending' | 'in_progress' | 'completed'
    completed_at?: string | null
  } = {
    status: nextStatus,
    completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', task.id)

  if (updateError) {
    logAndThrow('actualizar task.status', updateError)
  }

  await recordTaskStatusHistory({
    taskId: task.id,
    buildingId,
    profileId,
    fromStatus: previousStatus,
    toStatus: nextStatus,
    reason,
  })

  const shouldInsertTreatment =
    previousStatus !== 'completed' && nextStatus === 'completed'

  if (!shouldInsertTreatment) {
    return
  }

  const { data: freshTask, error: fetchTaskError } = await supabase
    .from('tasks')
    .select(`
      id,
      building_id,
      title,
      priority,
      apartment_or_area,
      apartment_key,
      category,
      pest_targets,
      treatment_visit_type,
      description,
      task_date
    `)
    .eq('id', task.id)
    .single()

  if (fetchTaskError || !freshTask) {
    logAndThrow(
      'leer tarea actualizada',
      fetchTaskError || new Error('No se encontro la tarea')
    )
  }

  if (freshTask.category !== 'pest') {
    await recordCompletedTaskInUnitHistory({
      task: freshTask,
      profileId,
    })
    return
  }

  const taskApartments = await fetchTaskApartments(freshTask.id)

  const pestTargets = Array.isArray(freshTask.pest_targets)
    ? freshTask.pest_targets
    : []

  console.log('freshTask para tratamiento:', {
    id: freshTask.id,
    apartment: freshTask.apartment_or_area?.trim(),
    apartmentKey: freshTask.apartment_key?.trim(),
    category: freshTask.category,
    pestTargets,
    treatmentVisitType: freshTask.treatment_visit_type,
    taskDate: freshTask.task_date,
    taskApartments,
  })

  const isValidPestTask =
    freshTask.category === 'pest' &&
    pestTargets.length > 0 &&
    (taskApartments.length > 0 ||
      (!!freshTask.treatment_visit_type && !!freshTask.apartment_or_area?.trim()))

  if (!isValidPestTask) {
    console.warn(
      'La tarea se completo pero no genera tratamiento porque faltan datos',
      {
        category: freshTask.category,
        pestTargets,
        treatmentVisitType: freshTask.treatment_visit_type,
        apartment: freshTask.apartment_or_area,
        taskApartments,
      }
    )
    return
  }

  const { data: existingTreatments, error: existingError } = await supabase
    .from('pest_treatments')
    .select('id, pest_target, apartment_key, apartment_or_area')
    .eq('task_id', freshTask.id)

  if (existingError) {
    logAndThrow('buscar tratamientos existentes', existingError)
  }

  const existingKeys = new Set(
    (existingTreatments || []).map((item) => {
      const apartmentRef =
        item.apartment_key?.trim() || item.apartment_or_area?.trim() || ''
      const pestTarget = item.pest_target || ''
      return `${apartmentRef}::${pestTarget}`
    })
  )

  const rowsToInsert =
    taskApartments.length > 0
      ? taskApartments.flatMap((apartmentItem) => {
          const apartment = apartmentItem.apartment_or_area?.trim()
          const apartmentKey = apartmentItem.apartment_key?.trim() || null

          if (!apartment) return []

          return pestTargets
            .filter((target: string) => {
              const apartmentRef = apartmentKey || apartment
              return !existingKeys.has(`${apartmentRef}::${target}`)
            })
            .map((target: string) => ({
              building_id: buildingId,
              task_id: freshTask.id,
              created_by: profileId,
              apartment_or_area: apartment,
              apartment_key: apartmentKey,
              pest_target: target,
              treatment_visit_type: apartmentItem.visit_type,
              treatment_type: apartmentItem.visit_type,
              treatment_date: freshTask.task_date,
              notes: freshTask.description?.trim() || null,
            }))
        })
      : pestTargets
          .filter((target: string) => {
            const apartmentRef =
              freshTask.apartment_key?.trim() ||
              freshTask.apartment_or_area?.trim() ||
              ''
            return !existingKeys.has(`${apartmentRef}::${target}`)
          })
          .map((target: string) => ({
            building_id: buildingId,
            task_id: freshTask.id,
            created_by: profileId,
            apartment_or_area: freshTask.apartment_or_area?.trim() || 'Sin especificar',
            apartment_key: freshTask.apartment_key?.trim() || null,
            pest_target: target,
            treatment_visit_type: freshTask.treatment_visit_type,
            treatment_type: freshTask.treatment_visit_type,
            treatment_date: freshTask.task_date,
            notes: freshTask.description?.trim() || null,
          }))

  console.log('rowsToInsert en pest_treatments:', rowsToInsert)

  if (rowsToInsert.length === 0) {
    return
  }

  const { data: insertedTreatments, error: treatmentError } = await supabase
    .from('pest_treatments')
    .insert(rowsToInsert)
    .select('*')

  if (treatmentError) {
    logAndThrow('insertar pest_treatments', treatmentError)
  }

  await recordPestTreatmentsInUnitHistory({
    treatments: (insertedTreatments || []) as PestTreatmentRow[],
    profileId,
  })
}
