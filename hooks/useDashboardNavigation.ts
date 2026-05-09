'use client'

import { useCallback } from 'react'

import { useRouter } from '@/i18n/navigation'

type SummaryKey = 'today' | 'urgent' | 'overdue'

type UseDashboardNavigationParams = {
  buildingId: string
}

export function useDashboardNavigation({
  buildingId,
}: UseDashboardNavigationParams) {
  const router = useRouter()

  const openBuildingDashboard = useCallback(
    (nextBuildingId: string) => {
      router.push(`/dashboard?buildingId=${nextBuildingId}`)
    },
    [router]
  )

  const openTodayTasks = useCallback(() => {
    router.push(`/tasks?buildingId=${buildingId}&filter=today`)
  }, [buildingId, router])

  const openUrgentTasks = useCallback(() => {
    router.push(`/tasks?buildingId=${buildingId}&filter=urgent`)
  }, [buildingId, router])

  const openOverdueTasks = useCallback(() => {
    router.push(`/tasks?buildingId=${buildingId}&filter=overdue`)
  }, [buildingId, router])

  const openProblems = useCallback(() => {
    router.push(`/tasks?buildingId=${buildingId}`)
  }, [buildingId, router])

  const openAgenda = useCallback(() => {
    router.push(`/agenda?buildingId=${buildingId}`)
  }, [buildingId, router])

  const openAllTasks = useCallback(() => {
    router.push(`/tasks?buildingId=${buildingId}`)
  }, [buildingId, router])

  const openSummaryTask = useCallback(
    (nextBuildingId: string, taskId: string, summaryKey: SummaryKey) => {
      router.push(
        `/tasks?buildingId=${nextBuildingId}&filter=${summaryKey}&taskId=${taskId}`
      )
    },
    [router]
  )

  const openBuildingMessages = useCallback(() => {
    if (!buildingId) return
    router.replace(`/dashboard?buildingId=${buildingId}&openMessages=1`)
  }, [buildingId, router])

  const openMessagesForBuilding = useCallback(
    (nextBuildingId: string) => {
      router.push(`/dashboard?buildingId=${nextBuildingId}&openMessages=1`)
    },
    [router]
  )

  return {
    openBuildingDashboard,
    openTodayTasks,
    openUrgentTasks,
    openOverdueTasks,
    openProblems,
    openAgenda,
    openAllTasks,
    openSummaryTask,
    openBuildingMessages,
    openMessagesForBuilding,
  }
}
