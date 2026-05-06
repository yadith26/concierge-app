import { supabase } from '@/lib/supabase'
import type { BuildingMessage } from '@/lib/messages/messageService'
import {
  TASK_SELECT_FIELDS,
  normalizeTask,
} from '@/lib/tasks/taskHelpers'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { getLocalDateInputValue } from '@/lib/dates/localDate'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type DashboardContact = {
  id: string
  name: string
}

type DashboardDataResult = {
  avatarKey: string | null
  userName: string
  profileId: string
  buildingId: string
  buildingName: string
  buildings: { id: string; name: string; address: string | null }[]
  homeBuildings: ConciergeHomeBuilding[]
  homeSummary: ConciergeHomeSummary
  homeTasks: ConciergeHomeTasksByStatus
  isConciergeHome: boolean
  profilePhotoUrl: string | null
  tasks: EditableTask[]
  messages: BuildingMessage[]
  managerContact: DashboardContact | null
}

export type ConciergeHomeSummary = {
  completedToday: number
  overdue: number
  today: number
  urgent: number
}

export type ConciergeHomeTask = {
  id: string
  title: string
  apartmentOrArea: string | null
  buildingId: string
  buildingName: string
  taskDate: string
  taskTime?: string | null
  priority: EditableTask['priority']
}

export type ConciergeHomeTasksByStatus = {
  overdue: ConciergeHomeTask[]
  today: ConciergeHomeTask[]
  urgent: ConciergeHomeTask[]
}

export type ConciergeHomeBuilding = {
  address: string | null
  id: string
  name: string
  overdueCount: number
  pendingCount: number
  todayCount: number
  urgentCount: number
}

const emptyHomeSummary: ConciergeHomeSummary = {
  completedToday: 0,
  overdue: 0,
  today: 0,
  urgent: 0,
}

const emptyHomeTasks: ConciergeHomeTasksByStatus = {
  overdue: [],
  today: [],
  urgent: [],
}

function isCompletedToday(task: EditableTask, todayKey: string) {
  if (task.status !== 'completed') return false
  if (!task.completed_at) return task.task_date === todayKey

  return getLocalDateInputValue(new Date(task.completed_at)) === todayKey
}

function buildConciergeHome({
  buildings,
  tasks,
  todayKey,
}: {
  buildings: { id: string; name: string; address: string | null }[]
  tasks: EditableTask[]
  todayKey: string
}) {
  const activeTasks = tasks.filter((task) => task.status !== 'completed')
  const buildingNames = new Map(
    buildings.map((building) => [building.id, building.name])
  )

  const sortHomeTasks = (a: EditableTask, b: EditableTask) => {
    const priorityRank = { high: 0, medium: 1, low: 2 }
    const aPriority = priorityRank[a.priority]
    const bPriority = priorityRank[b.priority]

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    const aDateTime = new Date(
      `${a.task_date}T${a.task_time && a.task_time.trim() ? a.task_time : '23:59'}`
    ).getTime()
    const bDateTime = new Date(
      `${b.task_date}T${b.task_time && b.task_time.trim() ? b.task_time : '23:59'}`
    ).getTime()

    if (aDateTime !== bDateTime) {
      return aDateTime - bDateTime
    }

    return a.title.localeCompare(b.title, 'es')
  }

  const toHomeTask = (task: EditableTask): ConciergeHomeTask => ({
    id: task.id,
    title: task.title,
    apartmentOrArea: task.apartment_or_area || null,
    buildingId: task.building_id || '',
    buildingName: buildingNames.get(task.building_id || '') || 'Sin edificio',
    taskDate: task.task_date,
    taskTime: task.task_time || null,
    priority: task.priority,
  })

  const homeSummary: ConciergeHomeSummary = {
    completedToday: tasks.filter((task) => isCompletedToday(task, todayKey)).length,
    overdue: activeTasks.filter((task) => task.task_date < todayKey).length,
    today: activeTasks.filter((task) => task.task_date === todayKey).length,
    urgent: activeTasks.filter((task) => task.priority === 'high').length,
  }

  const homeTasks: ConciergeHomeTasksByStatus = {
    overdue: activeTasks
      .filter((task) => task.task_date < todayKey)
      .sort(sortHomeTasks)
      .slice(0, 8)
      .map(toHomeTask),
    today: activeTasks
      .filter((task) => task.task_date === todayKey)
      .sort(sortHomeTasks)
      .slice(0, 8)
      .map(toHomeTask),
    urgent: activeTasks
      .filter((task) => task.priority === 'high')
      .sort(sortHomeTasks)
      .slice(0, 8)
      .map(toHomeTask),
  }

  const homeBuildings = buildings.map((building) => {
    const buildingTasks = tasks.filter((task) => task.building_id === building.id)
    const activeBuildingTasks = buildingTasks.filter(
      (task) => task.status !== 'completed'
    )

    return {
      address: building.address,
      id: building.id,
      name: building.name,
      overdueCount: activeBuildingTasks.filter((task) => task.task_date < todayKey)
        .length,
      pendingCount: activeBuildingTasks.length,
      todayCount: activeBuildingTasks.filter((task) => task.task_date === todayKey)
        .length,
      urgentCount: activeBuildingTasks.filter((task) => task.priority === 'high')
        .length,
    }
  })

  return { homeBuildings, homeSummary, homeTasks }
}

export async function getDashboardData(
  preferredBuildingId?: string | null
): Promise<DashboardDataResult> {
  const {
    data: { user },
    error: userError,
  } = await getSafeAuthUser()

  if (userError || !user) {
    throw new Error(
      userError?.message || 'No se pudo obtener el usuario autenticado'
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_key, profile_photo_url')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(
      profileError?.message || 'No se pudo obtener el perfil del usuario'
    )
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('building_users')
    .select('buildings_new(id, name, address)')
    .eq('user_id', profile.id)
    .eq('role', 'concierge')

  if (membershipError) {
    throw new Error(
      membershipError.message || 'No se pudo obtener el edificio del usuario'
    )
  }

  const buildings = (
    ((memberships as Array<{
      buildings_new:
        | { id: string; name: string; address: string | null }
        | { id: string; name: string; address: string | null }[]
        | null
    }>) || [])
      .flatMap((membership) => membership.buildings_new ?? [])
      .filter(Boolean)
  ) as { id: string; name: string; address: string | null }[]

  if (!buildings.length) {
    throw new Error('No se pudo obtener el edificio del usuario')
  }

  const building =
    buildings.find((item) => item.id === preferredBuildingId) ||
    (preferredBuildingId || buildings.length <= 1 ? buildings[0] : null) ||
    null

  if (!building) {
    const { data: allTasksData, error: allTasksError } = await supabase
      .from('tasks')
      .select(TASK_SELECT_FIELDS)
      .in(
        'building_id',
        buildings.map((item) => item.id)
      )

    if (allTasksError) {
      throw new Error(allTasksError.message || 'No se pudieron obtener las tareas')
    }

    const allTasks = ((allTasksData as EditableTask[]) || []).map(normalizeTask)
    const { homeBuildings, homeSummary, homeTasks } = buildConciergeHome({
      buildings,
      tasks: allTasks,
      todayKey: getLocalDateInputValue(),
    })

    return {
      avatarKey: profile.avatar_key || null,
      userName: profile.first_name || '',
      profileId: profile.id,
      buildingId: '',
      buildingName: '',
      buildings,
      homeBuildings,
      homeSummary,
      homeTasks,
      isConciergeHome: true,
      profilePhotoUrl: profile.profile_photo_url || null,
      tasks: [],
      messages: [],
      managerContact: null,
    }
  }

  const [
    { data: tasksData, error: tasksError },
    { data: managerMemberships, error: managerMembershipError },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select(TASK_SELECT_FIELDS)
      .eq('building_id', building.id),
    supabase
      .from('building_users')
      .select('user_id')
      .eq('building_id', building.id)
      .eq('role', 'manager')
      .limit(1),
  ])

  if (tasksError) {
    throw new Error(tasksError.message || 'No se pudieron obtener las tareas')
  }

  if (managerMembershipError) {
    throw new Error(
      managerMembershipError.message || 'No se pudo obtener el manager del edificio'
    )
  }

  const managerId =
    ((managerMemberships as Array<{ user_id: string }>) || [])[0]?.user_id || null

  let managerContact: DashboardContact | null = null

  if (managerId) {
    const { data: managerProfile, error: managerProfileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', managerId)
      .maybeSingle()

    if (managerProfileError) {
      throw new Error(
        managerProfileError.message || 'No se pudo obtener el perfil del manager'
      )
    }

    if (managerProfile) {
      managerContact = {
        id: managerProfile.id,
        name:
          [managerProfile.first_name, managerProfile.last_name]
            .filter(Boolean)
            .join(' ') || 'Manager',
      }
    }
  }

  return {
    avatarKey: profile.avatar_key || null,
    userName: profile.first_name || '',
    profileId: profile.id,
    buildingId: building.id,
    buildingName: building.name,
    buildings,
    homeBuildings: [],
    homeSummary: emptyHomeSummary,
    homeTasks: emptyHomeTasks,
    isConciergeHome: false,
    profilePhotoUrl: profile.profile_photo_url || null,
    tasks: ((tasksData as EditableTask[]) || []).map(normalizeTask),
    messages: [],
    managerContact,
  }
}

export async function deleteDashboardTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw new Error(error.message || 'No se pudo eliminar la tarea')
  }
}
