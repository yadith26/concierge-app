import { supabase } from '@/lib/supabase'
import type { TaskStatus } from '@/lib/tasks/taskTypes'

export type TaskStatusHistoryEntry = {
  id: string
  task_id: string
  building_id: string | null
  changed_by: string | null
  from_status: TaskStatus
  to_status: TaskStatus
  reason: string | null
  created_at: string
}

export async function recordTaskStatusHistory(params: {
  taskId: string
  buildingId?: string | null
  profileId?: string | null
  fromStatus: TaskStatus
  toStatus: TaskStatus
  reason?: string | null
}) {
  const { taskId, buildingId, profileId, fromStatus, toStatus, reason } = params

  if (fromStatus === toStatus) return

  const { error } = await supabase.from('task_status_history').insert({
    task_id: taskId,
    building_id: buildingId || null,
    changed_by: profileId || null,
    from_status: fromStatus,
    to_status: toStatus,
    reason: reason?.trim() || null,
  })

  if (error) {
    console.warn('No se pudo registrar task_status_history:', error)
  }
}

export async function fetchTaskStatusHistory(taskIds: string[]) {
  if (taskIds.length === 0) return [] as TaskStatusHistoryEntry[]

  const { data, error } = await supabase
    .from('task_status_history')
    .select('*')
    .in('task_id', taskIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('No se pudo leer task_status_history:', error)
    return [] as TaskStatusHistoryEntry[]
  }

  return (data as TaskStatusHistoryEntry[]) || []
}

export function buildLatestPendingReasonMap(
  history: TaskStatusHistoryEntry[]
) {
  const reasonMap = new Map<string, string>()

  history.forEach((entry) => {
    if (
      entry.to_status === 'pending' &&
      entry.reason &&
      !reasonMap.has(entry.task_id)
    ) {
      reasonMap.set(entry.task_id, entry.reason)
    }
  })

  return reasonMap
}
