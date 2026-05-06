import { supabase } from '@/lib/supabase'
import {
  TASK_SELECT_FIELDS,
  normalizeTask,
} from '@/lib/tasks/taskHelpers'
import { resolveConciergeBuildingContext } from '@/lib/buildings/conciergeBuildingContext'
import type { EditableTask } from '@/lib/tasks/taskTypes'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'

export type PestPageData = {
  tasks: EditableTask[]
  treatments: PestTreatmentRow[]
  buildingName: string
  buildingId: string
  profileId: string
}

export async function fetchPestPageData(): Promise<PestPageData> {
  const { profileId, building } = await resolveConciergeBuildingContext()

  if (!building) {
    throw new Error('No se pudo obtener el edificio')
  }

  const [
    { data: tasksData, error: tasksError },
    { data: historyData, error: historyError },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select(TASK_SELECT_FIELDS)
      .eq('building_id', building.id)
      .eq('category', 'pest'),
    supabase
      .from('pest_treatments')
      .select('*')
      .eq('building_id', building.id)
      .order('treatment_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (tasksError) {
    throw tasksError
  }

  if (historyError) {
    throw historyError
  }

  return {
    tasks: (((tasksData as EditableTask[]) || []).map(normalizeTask) ??
      []) as EditableTask[],
    treatments: (historyData as PestTreatmentRow[]) || [],
    buildingName: building.name,
    buildingId: building.id,
    profileId,
  }
}

export async function deletePestTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw error
  }
}

export async function deletePestHistoryRecord(recordId: string) {
  const { error } = await supabase
    .from('pest_treatments')
    .delete()
    .eq('id', recordId)

  if (error) {
    throw error
  }
}
