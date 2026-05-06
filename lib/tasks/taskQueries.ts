import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/tasks/taskTypes'
import { TASK_SELECT_FIELDS, normalizeTask } from '@/lib/tasks/taskHelpers'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'
import { resolveConciergeBuildingContext } from '@/lib/buildings/conciergeBuildingContext'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'

export type TasksPageData = {
  profileId: string
  buildingId: string
  buildingName: string
  buildings: BuildingSummary[]
  tasks: Task[]
}

export async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await getSafeAuthUser()

  if (error || !user) {
    throw new Error('No se pudo obtener el usuario autenticado')
  }

  return user.id
}

export async function getProfileIdByUserId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('No se pudo obtener el perfil del usuario')
  }

  return data.id
}

export async function getBuildingByConciergeId(
  profileId: string,
  preferredBuildingId?: string | null
): Promise<{
  id: string
  name: string
}> {
  const { building } = await resolveConciergeBuildingContext(preferredBuildingId)

  if (!building) {
    throw new Error('No se pudo obtener el edificio del concierge')
  }

  return {
    id: building.id,
    name: building.name,
  }
}

export async function fetchTasksByBuildingId(
  buildingId: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT_FIELDS)
    .eq('building_id', buildingId)

  if (error) {
    throw new Error('No se pudieron obtener las tareas')
  }

  return ((data as Task[]) || []).map(normalizeTask)
}

export async function fetchTasksPageData(
  preferredBuildingId?: string | null
): Promise<TasksPageData> {
  const { profileId, buildings, building } =
    await resolveConciergeBuildingContext(preferredBuildingId)

  if (!building) {
    throw new Error('No se pudo obtener el edificio del concierge')
  }

  const tasks = await fetchTasksByBuildingId(building.id)

  return {
    profileId,
    buildingId: building.id,
    buildingName: building.name,
    buildings,
    tasks,
  }
}
