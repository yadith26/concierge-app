import { supabase } from '@/lib/supabase'
import {
  normalizeManagerTaskCategory,
  type ManagerTaskCategory,
} from '@/lib/manager/managerTaskCategories'
import type { TaskPriority, TaskStatus } from '@/lib/tasks/taskTypes'

export type ManagerTaskPayload = {
  buildingId?: string | null
  managerId: string
  conciergeId?: string | null
  sourceMessageId?: string | null
  title: string
  description?: string | null
  category: ManagerTaskCategory
  priority: TaskPriority
  taskDate: string
  taskTime?: string | null
  apartmentOrArea?: string | null
}

export type ManagerTask = {
  id: string
  building_id: string | null
  manager_id: string
  concierge_id: string | null
  source_message_id: string | null
  title: string
  description: string | null
  category: ManagerTaskCategory
  priority: TaskPriority
  status: TaskStatus
  task_date: string
  task_time: string | null
  apartment_or_area: string | null
  created_at: string
  updated_at: string | null
  completed_at: string | null
}

export type ManagerTaskSummary = {
  today: ManagerTask[]
  overdue: ManagerTask[]
  upcoming: ManagerTask[]
  completedRecent: ManagerTask[]
  pending: ManagerTask[]
}

const MANAGER_TASK_SELECT_FIELDS = `
  id,
  building_id,
  manager_id,
  concierge_id,
  source_message_id,
  title,
  description,
  category,
  priority,
  status,
  task_date,
  task_time,
  apartment_or_area,
  created_at,
  updated_at,
  completed_at
`

function isMissingManagerTasksTable(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || error?.message?.includes('manager_tasks')
}

function todayDateInput() {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function fetchManagerTasksForManager(
  managerId: string
): Promise<ManagerTask[]> {
  if (!managerId) return []

  const { data, error } = await supabase
    .from('manager_tasks')
    .select(MANAGER_TASK_SELECT_FIELDS)
    .eq('manager_id', managerId)
    .order('task_date', { ascending: true })

  if (isMissingManagerTasksTable(error)) {
    return []
  }

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar las tareas del manager.')
  }

  return ((data as ManagerTask[]) || []).map(normalizeManagerTaskRow)
}

export async function fetchConciergeTodayTaskCountsByBuilding(
  buildingIds: string[]
): Promise<Record<string, number>> {
  const uniqueBuildingIds = [...new Set(buildingIds.filter(Boolean))]

  if (!uniqueBuildingIds.length) return {}

  const { data, error } = await supabase
    .from('tasks')
    .select('building_id, status')
    .in('building_id', uniqueBuildingIds)
    .eq('task_date', todayDateInput())
    .neq('status', 'completed')

  if (error) {
    throw new Error(
      error.message ||
        'No se pudieron cargar los conteos de tareas de hoy del conserje.'
    )
  }

  return ((data as Array<{ building_id: string | null; status: string }>) || [])
    .filter((task) => task.building_id)
    .reduce<Record<string, number>>((counts, task) => {
      const buildingId = task.building_id as string
      counts[buildingId] = (counts[buildingId] || 0) + 1
      return counts
    }, {})
}

export function buildManagerTaskSummary(
  tasks: ManagerTask[],
  today = todayDateInput()
): ManagerTaskSummary {
  const activeTasks = tasks.filter((task) => task.status !== 'completed')

  return {
    today: activeTasks.filter((task) => task.task_date === today),
    overdue: activeTasks.filter((task) => task.task_date < today),
    upcoming: activeTasks.filter((task) => task.task_date > today),
    completedRecent: tasks
      .filter((task) => task.status === 'completed')
      .sort((a, b) => {
        const aDate = a.completed_at || a.updated_at || a.created_at
        const bDate = b.completed_at || b.updated_at || b.created_at
        return bDate.localeCompare(aDate)
      })
      .slice(0, 4),
    pending: activeTasks,
  }
}

export function buildManagerTaskCountsByBuilding(tasks: ManagerTask[]) {
  return tasks
    .filter((task) => task.status !== 'completed' && task.building_id)
    .reduce<Record<string, number>>((counts, task) => {
      const buildingId = task.building_id as string
      counts[buildingId] = (counts[buildingId] || 0) + 1
      return counts
    }, {})
}

export async function createManagerTask(payload: ManagerTaskPayload) {
  const title = payload.title.trim()

  if (!title) {
    throw new Error('Escribe un titulo para la tarea.')
  }

  const { data, error } = await supabase
    .from('manager_tasks')
    .insert({
      building_id: payload.buildingId || null,
      manager_id: payload.managerId,
      concierge_id: payload.conciergeId || null,
      source_message_id: payload.sourceMessageId || null,
      title,
      description: payload.description?.trim() || null,
      category: payload.category,
      priority: payload.priority,
      task_date: payload.taskDate,
      task_time: payload.taskTime || null,
      apartment_or_area: payload.apartmentOrArea?.trim() || null,
      status: 'pending' satisfies TaskStatus,
    })
    .select('id')
    .single()

  if (isMissingManagerTasksTable(error)) {
    throw new Error(
      'Falta crear la tabla manager_tasks en Supabase. Ejecuta database/manager_tasks.sql y vuelve a intentar.'
    )
  }

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo crear la tarea del manager.')
  }

  return data.id as string
}

export async function updateManagerTaskStatus({
  taskId,
  managerId,
  status,
}: {
  taskId: string
  managerId: string
  status: TaskStatus
}) {
  const { error } = await supabase
    .from('manager_tasks')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('manager_id', managerId)

  if (isMissingManagerTasksTable(error)) {
    throw new Error(
      'Falta crear la tabla manager_tasks en Supabase. Ejecuta database/manager_tasks.sql y vuelve a intentar.'
    )
  }

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar la tarea del manager.')
  }
}

export async function updateManagerTask({
  taskId,
  payload,
}: {
  taskId: string
  payload: ManagerTaskPayload
}) {
  const title = payload.title.trim()

  if (!title) {
    throw new Error('Escribe un titulo para la tarea.')
  }

  const { error } = await supabase
    .from('manager_tasks')
    .update({
      building_id: payload.buildingId || null,
      concierge_id: payload.conciergeId || null,
      source_message_id: payload.sourceMessageId || null,
      title,
      description: payload.description?.trim() || null,
      category: payload.category,
      priority: payload.priority,
      task_date: payload.taskDate,
      task_time: payload.taskTime || null,
      apartment_or_area: payload.apartmentOrArea?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('manager_id', payload.managerId)

  if (isMissingManagerTasksTable(error)) {
    throw new Error(
      'Falta crear la tabla manager_tasks en Supabase. Ejecuta database/manager_tasks.sql y vuelve a intentar.'
    )
  }

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar la tarea del manager.')
  }
}

export async function deleteManagerTask({
  taskId,
  managerId,
}: {
  taskId: string
  managerId: string
}) {
  const { error } = await supabase
    .from('manager_tasks')
    .delete()
    .eq('id', taskId)
    .eq('manager_id', managerId)

  if (isMissingManagerTasksTable(error)) {
    throw new Error(
      'Falta crear la tabla manager_tasks en Supabase. Ejecuta database/manager_tasks.sql y vuelve a intentar.'
    )
  }

  if (error) {
    throw new Error(error.message || 'No se pudo eliminar la tarea del manager.')
  }
}

function normalizeManagerTaskRow(task: ManagerTask): ManagerTask {
  return {
    ...task,
    category: normalizeManagerTaskCategory(task.category) || 'other',
  }
}
