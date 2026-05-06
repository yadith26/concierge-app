import { supabase } from '@/lib/supabase'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'
import type { PestTarget, TaskStatus, TreatmentVisitType } from '@/lib/tasks/taskTypes'

export type SupervisionTreatment = {
  id: string
  building_id: string
  apartment_or_area: string
  apartment_key: string | null
  pest_target: PestTarget | null
  treatment_visit_type: TreatmentVisitType | null
  treatment_date: string
}

export type SupervisionAlert = {
  buildingId: string
  apartmentOrArea: string
  apartmentKey: string | null
  count: number
  latestDate: string
}

export type BuildingSupervisionSummary = {
  building: BuildingSummary
  totalMonthTasks: number
  completedMonthTasks: number
  completionRate: number
  overdueTasks: number
  todayTasks: number
  latestTreatment: SupervisionTreatment | null
  alerts: SupervisionAlert[]
}

type OperationalTaskRow = {
  building_id: string | null
  status: TaskStatus
  task_date: string
}

function getDateInput(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthRange(date = new Date()) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return {
    from: getDateInput(first),
    to: getDateInput(last),
  }
}

function getRecentTreatmentStart(date = new Date()) {
  const recent = new Date(date)
  recent.setDate(recent.getDate() - 60)
  return getDateInput(recent)
}

export async function fetchManagerSupervisionData(
  buildings: BuildingSummary[]
): Promise<BuildingSupervisionSummary[]> {
  const buildingIds = buildings.map((building) => building.id)

  if (buildingIds.length === 0) return []

  const today = getDateInput(new Date())
  const monthRange = getMonthRange()
  const recentTreatmentStart = getRecentTreatmentStart()

  const [
    { data: monthTasks, error: monthTasksError },
    { data: overdueTasks, error: overdueTasksError },
    { data: treatments, error: treatmentsError },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('building_id, status, task_date')
      .in('building_id', buildingIds)
      .gte('task_date', monthRange.from)
      .lte('task_date', monthRange.to),
    supabase
      .from('tasks')
      .select('building_id, status, task_date')
      .in('building_id', buildingIds)
      .lt('task_date', today)
      .neq('status', 'completed'),
    supabase
      .from('pest_treatments')
      .select(
        'id, building_id, apartment_or_area, apartment_key, pest_target, treatment_visit_type, treatment_date'
      )
      .in('building_id', buildingIds)
      .gte('treatment_date', recentTreatmentStart)
      .order('treatment_date', { ascending: false }),
  ])

  if (monthTasksError) {
    throw new Error(monthTasksError.message || 'No se pudieron cargar las tareas.')
  }

  if (overdueTasksError) {
    throw new Error(
      overdueTasksError.message || 'No se pudieron cargar las tareas atrasadas.'
    )
  }

  if (treatmentsError) {
    throw new Error(
      treatmentsError.message || 'No se pudieron cargar los tratamientos.'
    )
  }

  const monthTaskRows = ((monthTasks as OperationalTaskRow[]) || []).filter(
    (task) => !!task.building_id
  )
  const overdueTaskRows = ((overdueTasks as OperationalTaskRow[]) || []).filter(
    (task) => !!task.building_id
  )
  const treatmentRows = ((treatments as SupervisionTreatment[]) || []).filter(
    (treatment) => !!treatment.building_id
  )

  return buildings.map((building) => {
    const buildingMonthTasks = monthTaskRows.filter(
      (task) => task.building_id === building.id
    )
    const completedMonthTasks = buildingMonthTasks.filter(
      (task) => task.status === 'completed'
    ).length
    const totalMonthTasks = buildingMonthTasks.length
    const buildingTreatments = treatmentRows.filter(
      (treatment) => treatment.building_id === building.id
    )

    return {
      building,
      totalMonthTasks,
      completedMonthTasks,
      completionRate:
        totalMonthTasks > 0
          ? Math.round((completedMonthTasks / totalMonthTasks) * 100)
          : 0,
      overdueTasks: overdueTaskRows.filter(
        (task) => task.building_id === building.id
      ).length,
      todayTasks: monthTaskRows.filter(
        (task) =>
          task.building_id === building.id &&
          task.task_date === today &&
          task.status !== 'completed'
      ).length,
      latestTreatment: buildingTreatments[0] || null,
      alerts: buildTreatmentAlerts(building.id, buildingTreatments),
    }
  })
}

function buildTreatmentAlerts(
  buildingId: string,
  treatments: SupervisionTreatment[]
) {
  const grouped = treatments.reduce<Record<string, SupervisionTreatment[]>>(
    (map, treatment) => {
      const key = treatment.apartment_key || treatment.apartment_or_area
      if (!key) return map

      map[key] = [...(map[key] || []), treatment]
      return map
    },
    {}
  )

  return Object.values(grouped)
    .filter((items) => items.length >= 3)
    .map((items) => ({
      buildingId,
      apartmentOrArea: items[0].apartment_or_area,
      apartmentKey: items[0].apartment_key,
      count: items.length,
      latestDate: items[0].treatment_date,
    }))
    .sort((a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate))
}
