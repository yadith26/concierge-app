'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getDashboardData,
  type ConciergeHomeBuilding,
  type ConciergeHomeSummary,
  type ConciergeHomeTasksByStatus,
} from '@/lib/dashboard/dashboardService'
import type { BuildingMessage, RecentBuildingConversation } from '@/lib/messages/messageService'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type DashboardContact = {
  id: string
  name: string
}

type UseDashboardDataParams = {
  selectedBuildingId?: string | null
}

export function useDashboardData({
  selectedBuildingId,
}: UseDashboardDataParams) {
  const isHomeSelection = !selectedBuildingId?.trim()
  const [userName, setUserName] = useState('')
  const [avatarKey, setAvatarKey] = useState<string | null>(null)
  const [buildingName, setBuildingName] = useState('')
  const [buildings, setBuildings] = useState<
    { id: string; name: string; address: string | null }[]
  >([])
  const [tasks, setTasks] = useState<EditableTask[]>([])
  const [loading, setLoading] = useState(true)
  const [buildingId, setBuildingId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [managerContact, setManagerContact] = useState<DashboardContact | null>(null)
  const [messages, setMessages] = useState<BuildingMessage[]>([])
  const [recentConversations, setRecentConversations] = useState<
    RecentBuildingConversation[]
  >([])
  const [homeBuildings, setHomeBuildings] = useState<ConciergeHomeBuilding[]>([])
  const [homeSummary, setHomeSummary] = useState<ConciergeHomeSummary>({
    completedToday: 0,
    overdue: 0,
    today: 0,
    urgent: 0,
  })
  const [homeTasks, setHomeTasks] = useState<ConciergeHomeTasksByStatus>({
    overdue: [],
    today: [],
    urgent: [],
  })
  const [isConciergeHome, setIsConciergeHome] = useState(false)

  const fetchRequestIdRef = useRef(0)

  const clearHomeSelectionState = useCallback(() => {
    setBuildingId('')
    setBuildingName('')
    setManagerContact(null)
    setTasks([])
    setMessages([])
    setRecentConversations([])
    setIsConciergeHome(true)
  }, [])

  const clearDashboardDataAfterError = useCallback(() => {
    setTasks([])
    setMessages([])
    setManagerContact(null)
    setHomeBuildings([])
    setHomeTasks({
      overdue: [],
      today: [],
      urgent: [],
    })
    setIsConciergeHome(false)
  }, [])

  const applyDashboardData = useCallback(
    (data: Awaited<ReturnType<typeof getDashboardData>>) => {
      setAvatarKey(data.avatarKey)
      setUserName(data.userName)
      setProfileId(data.profileId)
      setProfilePhotoUrl(data.profilePhotoUrl)
      setBuildingName(data.buildingName)
      setBuildingId(data.buildingId)
      setBuildings(data.buildings)
      setHomeBuildings(data.homeBuildings)
      setHomeSummary(data.homeSummary)
      setHomeTasks(data.homeTasks)
      setIsConciergeHome(data.isConciergeHome)
      setTasks(data.tasks)
      setMessages(data.messages)
      setRecentConversations([])
      setManagerContact(data.managerContact)
    },
    []
  )

  const fetchDashboardData = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current
    setLoading(true)

    try {
      const data = await getDashboardData(selectedBuildingId)

      if (fetchRequestIdRef.current !== requestId) {
        return
      }

      applyDashboardData(data)
    } catch (error) {
      if (fetchRequestIdRef.current !== requestId) {
        return
      }

      console.error('Error cargando dashboard:', error)
      clearDashboardDataAfterError()
    } finally {
      if (fetchRequestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [applyDashboardData, clearDashboardDataAfterError, selectedBuildingId])

  useEffect(() => {
    if (!isHomeSelection) return
    clearHomeSelectionState()
  }, [clearHomeSelectionState, isHomeSelection])

  useEffect(() => {
    fetchRequestIdRef.current += 1
  }, [selectedBuildingId])

  useEffect(() => {
    void fetchDashboardData()
  }, [fetchDashboardData])

  return {
    loading,
    avatarKey,
    userName,
    profilePhotoUrl,
    buildingName,
    buildings,
    buildingId,
    profileId,
    tasks,
    managerContact,
    messages,
    recentConversations,
    homeBuildings,
    homeSummary,
    homeTasks,
    isConciergeHome,
    setTasks,
    setMessages,
    setRecentConversations,
    fetchDashboardData,
  }
}
