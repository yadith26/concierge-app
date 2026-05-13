import { supabase } from '@/lib/supabase'
import { replaceTaskApartments, type TaskApartmentInput } from '@/lib/tasks/taskApartments'
import {
  createFollowUpTask,
  type CreateFollowUpTaskResult,
  type FollowUpSourceTask,
} from '@/lib/tasks/followUpHelpers'
import { deleteRemovedPhotos, uploadPhotosForTask } from '@/lib/tasks/taskPhotoActions'
import {
  buildFollowUpSourceTask,
  buildTaskPayload,
  shouldPromptPestFollowUp,
} from '@/lib/tasks/taskFormHelpers'
import type {
  ExistingTaskPhoto,
  PestTarget,
  TaskPriority,
  TaskStatus,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

type SelectedPhoto = {
  file: File
  preview: string
}

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
  photos: SelectedPhoto[]
}

type UpdateTaskFromFormParams = BaseTaskFormPayload & {
  taskId: string
  previousVisitType: TreatmentVisitType | null
  removedPhotoIds: string[]
  existingTaskPhotos?: ExistingTaskPhoto[]
}

type CreateTaskFromFormParams = BaseTaskFormPayload & {
  sourceRequestId?: string | null
}

export type TaskFormActionResult = {
  shouldPromptFollowUp: boolean
  followUpSourceTask: FollowUpSourceTask | null
}

export async function updateTaskFromForm(
  params: UpdateTaskFromFormParams
): Promise<TaskFormActionResult> {
  const payload = buildTaskPayload(params)

  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      building_id: payload.building_id,
      created_by: payload.created_by,
      title: payload.title,
      description: payload.description,
      apartment_or_area: payload.apartment_or_area,
      apartment_key: payload.apartment_key,
      category: payload.category,
      priority: payload.priority,
      task_date: payload.task_date,
      task_time: payload.task_time,
      pest_targets: payload.pest_targets,
      treatment_visit_type: payload.treatment_visit_type,
      pest_treatment_type: payload.pest_treatment_type,
    })
    .eq('id', params.taskId)

  if (updateError) {
    throw new Error('Could not update the task.')
  }

  if (params.category === 'pest') {
    await replaceTaskApartments(params.taskId, params.selectedApartments)
  }

  await deleteRemovedPhotos({
    removedPhotoIds: params.removedPhotoIds,
    taskPhotos: params.existingTaskPhotos,
  })

  await uploadPhotosForTask({
    taskId: params.taskId,
    profileId: params.profileId,
    photos: params.photos,
  })

  const shouldPromptFollowUp = shouldPromptPestFollowUp({
    category: params.category,
    previousVisitType: params.previousVisitType,
    selectedApartments: params.selectedApartments,
  })

  return {
    shouldPromptFollowUp,
    followUpSourceTask: shouldPromptFollowUp
      ? buildFollowUpSourceTask({
          taskId: params.taskId,
          title: params.title,
          description: params.description,
          priority: params.priority,
          taskDate: params.taskDate,
          taskTime: params.taskTime,
          pestTargets: params.pestTargets,
          apartmentOrArea: payload.pestLocationSummary,
        })
      : null,
  }
}

export async function createTaskFromForm(
  params: CreateTaskFromFormParams
): Promise<TaskFormActionResult> {
  const payload = buildTaskPayload(params)

  const createPayload = {
    building_id: payload.building_id,
    created_by: payload.created_by,
    title: payload.title,
    description: payload.description,
    apartment_or_area: payload.apartment_or_area,
    apartment_key: payload.apartment_key,
    category: payload.category,
    priority: payload.priority,
    task_date: payload.task_date,
    task_time: payload.task_time,
    pest_targets: payload.pest_targets,
    treatment_visit_type: payload.treatment_visit_type,
    pest_treatment_type: payload.pest_treatment_type,
    source_request_id: params.sourceRequestId || null,
    status: 'pending' as TaskStatus,
  }

  const { data: insertedTask, error: insertError } = await supabase
    .from('tasks')
    .insert(createPayload)
    .select('id')
    .single()

  if (insertError || !insertedTask) {
    throw new Error('Could not save the task.')
  }

  if (params.sourceRequestId) {
    await supabase
      .from('owner_requests')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', params.sourceRequestId)
  }

  if (params.category === 'pest') {
    await replaceTaskApartments(insertedTask.id, params.selectedApartments)
  }

  await uploadPhotosForTask({
    taskId: insertedTask.id,
    profileId: params.profileId,
    photos: params.photos,
  })

  const shouldPromptFollowUp = shouldPromptPestFollowUp({
    category: params.category,
    selectedApartments: params.selectedApartments,
  })

  return {
    shouldPromptFollowUp,
    followUpSourceTask: shouldPromptFollowUp
      ? buildFollowUpSourceTask({
          taskId: insertedTask.id,
          title: params.title,
          description: params.description,
          priority: params.priority,
          taskDate: params.taskDate,
          taskTime: params.taskTime,
          pestTargets: params.pestTargets,
          apartmentOrArea: payload.pestLocationSummary,
        })
      : null,
  }
}

export async function createFollowUpFromSource(params: {
  sourceTask: FollowUpSourceTask
  buildingId: string
  profileId: string
}): Promise<CreateFollowUpTaskResult> {
  return createFollowUpTask(params)
}
