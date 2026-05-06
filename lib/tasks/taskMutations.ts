import { supabase } from '@/lib/supabase'
import { updateTaskStatusWithTreatment } from '@/lib/tasks/taskStatusActions'
import type { Task, EditableTask } from '@/lib/tasks/taskTypes'

/**
 * Eliminar tarea por ID
 */
export async function deleteTaskById(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    throw new Error('Error eliminando tarea')
  }
}

/**
 * Crear nueva tarea
 */
export async function createTask(
  buildingId: string,
  profileId: string,
  task: EditableTask
): Promise<void> {
  const { error } = await supabase.from('tasks').insert({
    building_id: buildingId,
    created_by: profileId,
    title: task.title,
    description: task.description || null,
    apartment_or_area: task.apartment_or_area || null,
    apartment_key: task.apartment_key || null,
    category: task.category,
    priority: task.priority,
    status: task.status || 'pending',
    task_date: task.task_date,
    task_time: task.task_time || null,
    pest_treatment_type: task.pest_treatment_type || null,
    pest_targets: task.pest_targets || [],
    treatment_visit_type: task.treatment_visit_type || null,
  })

  if (error) {
    throw new Error('Error creando tarea')
  }
}

/**
 * Actualizar tarea existente
 */
export async function updateTask(
  taskId: string,
  task: EditableTask
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: task.title,
      description: task.description || null,
      apartment_or_area: task.apartment_or_area || null,
      apartment_key: task.apartment_key || null,
      category: task.category,
      priority: task.priority,
      status: task.status,
      task_date: task.task_date,
      task_time: task.task_time || null,
      pest_treatment_type: task.pest_treatment_type || null,
      pest_targets: task.pest_targets || [],
      treatment_visit_type: task.treatment_visit_type || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) {
    throw new Error('Error actualizando tarea')
  }
}

/**
 * Actualizar solo el estado de una tarea (simple)
 */
export async function updateTaskStatusMutation(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    throw new Error('Error actualizando estado de tarea')
  }
}

/**
 * Actualizar estado usando lógica avanzada (tratamientos incluidos)
 */
export async function updateTaskStatusWithLogic(params: {
  task: Task
  nextStatus: 'pending' | 'in_progress' | 'completed'
  buildingId: string
  profileId: string
}): Promise<void> {
  await updateTaskStatusWithTreatment(params)
}