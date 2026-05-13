'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import {
  filterDashboardTasks,
  getActiveDashboardFilterLabel,
  getCompletedDashboardTasks,
  getDashboardTaskCounts,
  getDashboardTaskSections,
  getNextDashboardTask,
  type DashboardStatusFilter,
} from '@/lib/dashboard/dashboardHelpers'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type UseDashboardTaskMetricsParams = {
  tasks: EditableTask[]
  statusFilter: DashboardStatusFilter
}

export function useDashboardTaskMetrics({
  tasks,
  statusFilter,
}: UseDashboardTaskMetricsParams) {
  const t = useTranslations('dashboardFilterLabels')
  const { pendingCount, urgentCount, completedCount } = useMemo(
    () => getDashboardTaskCounts(tasks),
    [tasks]
  )

  const completedTasks = useMemo(() => getCompletedDashboardTasks(tasks), [tasks])

  const filteredTasks = useMemo(
    () => filterDashboardTasks(tasks, statusFilter, completedTasks),
    [completedTasks, statusFilter, tasks]
  )

  const { overdueTasks, todayTasks, tomorrowTasks, upcomingTasks } = useMemo(
    () => getDashboardTaskSections(filteredTasks, statusFilter, completedTasks),
    [completedTasks, filteredTasks, statusFilter]
  )

  const nextTask = useMemo(
    () =>
      getNextDashboardTask({
        statusFilter,
        todayTasks,
        tomorrowTasks,
        upcomingTasks,
      }),
    [statusFilter, todayTasks, tomorrowTasks, upcomingTasks]
  )

  const todayUrgentCount = useMemo(
    () => todayTasks.filter((task) => task.priority === 'high').length,
    [todayTasks]
  )

  return {
    pendingCount,
    urgentCount,
    completedCount,
    completedTasks,
    filteredTasks,
    overdueTasks,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    nextTask,
    todayUrgentCount,
    activeFilterLabel: getActiveDashboardFilterLabel(statusFilter, {
      urgent: t('urgent'),
      pending: t('pending'),
      completed: t('completed'),
    }),
  }
}
