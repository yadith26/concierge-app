'use client'

import { useMemo } from 'react'

import type { DashboardCopy } from '@/lib/dashboard/dashboardCopy'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type UseDashboardInsightsParams = {
  copy: DashboardCopy
  locale: string
  tasks: EditableTask[]
  completedTasks: EditableTask[]
  overdueTasks: EditableTask[]
  todayTasks: EditableTask[]
  tomorrowTasks: EditableTask[]
  upcomingTasks: EditableTask[]
  nextTask: EditableTask | null
}

export function useDashboardInsights({
  copy,
  locale,
  tasks,
  completedTasks,
  overdueTasks,
  todayTasks,
  tomorrowTasks,
  upcomingTasks,
  nextTask,
}: UseDashboardInsightsParams) {
  return useMemo(() => {
    const isUrgentTask = (task: EditableTask) =>
      task.priority === 'high' && task.status !== 'completed'

    const dedupeTasks = (items: EditableTask[]) => {
      const seen = new Set<string>()
      return items.filter((task) => {
        if (seen.has(task.id)) return false
        seen.add(task.id)
        return true
      })
    }

    const firstUrgentOverdueTask = overdueTasks.find(isUrgentTask) ?? null
    const firstUrgentTodayTask = todayTasks.find(isUrgentTask) ?? null
    const firstUrgentUpcomingTask =
      tomorrowTasks.find(isUrgentTask) ?? upcomingTasks.find(isUrgentTask) ?? null

    const spotlightTask =
      firstUrgentOverdueTask ||
      firstUrgentTodayTask ||
      overdueTasks[0] ||
      todayTasks[0] ||
      firstUrgentUpcomingTask ||
      nextTask ||
      tomorrowTasks[0] ||
      upcomingTasks[0] ||
      null

    const spotlightReason =
      firstUrgentOverdueTask?.id === spotlightTask?.id
        ? copy.spotlightUrgentOverdue
        : firstUrgentTodayTask?.id === spotlightTask?.id
          ? copy.spotlightUrgentToday
          : overdueTasks[0]?.id === spotlightTask?.id
            ? copy.spotlightOverdue
            : todayTasks[0]?.id === spotlightTask?.id
              ? copy.spotlightToday
              : firstUrgentUpcomingTask?.id === spotlightTask?.id
                ? copy.spotlightUrgentNext
                : spotlightTask
                  ? copy.spotlightNext
                  : null

    const urgentTasks = dedupeTasks(
      [...overdueTasks, ...todayTasks, ...tomorrowTasks, ...upcomingTasks].filter(
        isUrgentTask
      )
    )

    const todayKey = new Date().toLocaleDateString('en-CA')
    const completedTodayTasks = completedTasks
      .filter((task) => {
        if (!task.completed_at) return false
        return new Date(task.completed_at).toLocaleDateString('en-CA') === todayKey
      })
      .sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 3)

    const hotAreas = Object.values(
      tasks.reduce<
        Record<string, { name: string; count: number; tasks: EditableTask[] }>
      >((acc, task) => {
        if (task.status === 'completed') return acc

        const area = (task.apartment_or_area || '').trim()
        if (!area) return acc

        const key = area.toLowerCase()
        if (!acc[key]) {
          acc[key] = { name: area, count: 0, tasks: [] }
        }

        acc[key].count += 1
        acc[key].tasks.push(task)
        return acc
      }, {})
    )
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, locale))
      .slice(0, 3)

    return {
      spotlightTask,
      spotlightReason,
      completedTodayTasks,
      activeProblems: dedupeTasks([...urgentTasks, ...overdueTasks]).slice(0, 3),
      todayDashboardTasks: todayTasks.slice(0, 4),
      smartReminders: dedupeTasks([...tomorrowTasks, ...upcomingTasks]).slice(0, 2),
      hotAreas,
    }
  }, [
    completedTasks,
    copy.spotlightNext,
    copy.spotlightOverdue,
    copy.spotlightToday,
    copy.spotlightUrgentNext,
    copy.spotlightUrgentOverdue,
    copy.spotlightUrgentToday,
    locale,
    nextTask,
    overdueTasks,
    tasks,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
  ])
}
