'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDashboardConversation } from '@/hooks/useDashboardConversation'
import { useDashboardTaskActions } from '@/hooks/useDashboardTaskActions'
import {
  filterDashboardTasks,
  getActiveDashboardFilterLabel,
  getCompletedDashboardTasks,
  getDashboardTaskCounts,
  getDashboardTaskSections,
  getNextDashboardTask,
  type DashboardStatusFilter,
} from '@/lib/dashboard/dashboardHelpers'
import {
  getDashboardData,
  type ConciergeHomeBuilding,
  type ConciergeHomeSummary,
  type ConciergeHomeTasksByStatus,
} from '@/lib/dashboard/dashboardService'
import {
  fetchRecentBuildingConversations,
  type BuildingMessage,
  type RecentBuildingConversation,
} from '@/lib/messages/messageService'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type DashboardTask = EditableTask
type DashboardContact = {
  id: string
  name: string
}

export function useDashboardPage(selectedBuildingId?: string | null) {
  const [userName, setUserName] = useState('')
  const [avatarKey, setAvatarKey] = useState<string | null>(null)
  const [buildingName, setBuildingName] = useState('')
  const [buildings, setBuildings] = useState<
    { id: string; name: string; address: string | null }[]
  >([])
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null)
  const [buildingId, setBuildingId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [managerContact, setManagerContact] = useState<DashboardContact | null>(null)
  const [messages, setMessages] = useState<BuildingMessage[]>([])
  const [recentConversations, setRecentConversations] = useState<
    RecentBuildingConversation[]
  >([])
  const [compactHeader, setCompactHeader] = useState(false)
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
  const [lastBuildingId, setLastBuildingId] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] =
    useState<DashboardStatusFilter>('all')
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)

  const scrollRef = useRef<HTMLElement | null>(null)
  const conversation = useDashboardConversation({
    buildingId,
    profileId,
    managerContact,
    messages,
    setMessages,
  })

  const fetchRecentConversations = useCallback(async (nextProfileId: string) => {
    if (!nextProfileId) {
      setRecentConversations([])
      return
    }

    const conversations = await fetchRecentBuildingConversations({
      userId: nextProfileId,
      limit: 20,
    }).catch(() => [])

    setRecentConversations(conversations)
  }, [])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)

    try {
      const data = await getDashboardData(selectedBuildingId)

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

      if (data.buildingId) {
        window.localStorage.setItem('concierge:lastBuildingId', data.buildingId)
        setLastBuildingId(data.buildingId)
      } else {
        const storedBuildingId =
          window.localStorage.getItem('concierge:lastBuildingId') || ''
        const hasStoredBuilding = data.homeBuildings.some(
          (building) => building.id === storedBuildingId
        )
        setLastBuildingId(hasStoredBuilding ? storedBuildingId : '')
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error)
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
    } finally {
      setLoading(false)
    }
  }, [selectedBuildingId])

  const openCreateModal = () => {
    setSelectedTask(null)
    setModalOpen(true)
  }

  const openEditModal = (task: DashboardTask) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const markRecentConversationRead = useCallback(
    (conversation: RecentBuildingConversation) => {
      setRecentConversations((currentConversations) =>
        currentConversations.map((item) =>
          item.building_id === conversation.building_id &&
          item.contact_id === conversation.contact_id
            ? { ...item, unread_count: 0 }
            : item
        )
      )
    },
    []
  )

  const closeModal = () => {
    setModalOpen(false)
    setSelectedTask(null)
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (!profileId) return

    const timeoutId = window.setTimeout(() => {
      void fetchRecentConversations(profileId)
    }, 150)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [fetchRecentConversations, profileId])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      setCompactHeader(element.scrollTop > 18)
    }

    handleScroll()
    element.addEventListener('scroll', handleScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [loading])

  const taskActions = useDashboardTaskActions({
    buildingId,
    profileId,
    tasks,
    setTasks,
    onReload: fetchDashboardData,
    onCollapseTask: (taskId) =>
      setExpandedTaskId((prev) => (prev === taskId ? null : prev)),
  })

  useEffect(() => {
    if (!scrollRef.current) return
    if (statusFilter === 'all') return

    scrollRef.current.scrollTo({
      top: 120,
      behavior: 'smooth',
    })
  }, [statusFilter])

  const { pendingCount, urgentCount, completedCount } = useMemo(
    () => getDashboardTaskCounts(tasks),
    [tasks]
  )

  const completedTasks = useMemo(() => {
    return getCompletedDashboardTasks(tasks)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return filterDashboardTasks(tasks, statusFilter, completedTasks)
  }, [tasks, statusFilter, completedTasks])

  const { overdueTasks, todayTasks, tomorrowTasks, upcomingTasks } = useMemo(() => {
    return getDashboardTaskSections(filteredTasks, statusFilter, completedTasks)
  }, [filteredTasks, completedTasks, statusFilter])

  const nextTask = useMemo(() => {
    return getNextDashboardTask({
      statusFilter,
      todayTasks,
      tomorrowTasks,
      upcomingTasks,
    })
  }, [todayTasks, tomorrowTasks, upcomingTasks, statusFilter])

  const todayUrgentCount = useMemo(
    () => todayTasks.filter((task) => task.priority === 'high').length,
    [todayTasks]
  )

  const activeFilterLabel = getActiveDashboardFilterLabel(statusFilter)

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
    messagesModalOpen: conversation.messagesModalOpen,
    conversationMessages: conversation.conversationMessages,
    conversationDraft: conversation.conversationDraft,
    conversationError: conversation.conversationError,
    conversationLoading: conversation.conversationLoading,
    conversationSending: conversation.conversationSending,
    unreadMessageCount: conversation.unreadMessageCount,
    modalOpen,
    selectedTask,
    compactHeader,
    homeBuildings,
    homeSummary,
    homeTasks,
    isConciergeHome,
    lastBuildingId,
    expandedTaskId,
    statusFilter,
    showOverdueTasks,
    undoDelete: taskActions.undoDelete,
    pendingCount,
    urgentCount,
    completedCount,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    nextTask,
    todayUrgentCount,
    activeFilterLabel,
    scrollRef,
    setStatusFilter,
    setShowOverdueTasks,
    setExpandedTaskId,
    setMessagesModalOpen: conversation.setMessagesModalOpen,
    setConversationDraft: conversation.setConversationDraft,
    openConversation: conversation.openConversation,
    markRecentConversationRead,
    openCreateModal,
    openEditModal,
    closeModal,
    updateTaskStatus: taskActions.updateTaskStatus,
    markMessageRead: conversation.markMessageRead,
    sendConversationMessage: conversation.sendConversationMessage,
    fetchDashboardData,
    queueDeleteTask: taskActions.queueDeleteTask,
    undoDeleteTask: taskActions.undoDeleteTask,
  }
}
