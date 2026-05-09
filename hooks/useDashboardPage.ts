'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDashboardConversation } from '@/hooks/useDashboardConversation'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useDashboardTaskActions } from '@/hooks/useDashboardTaskActions'
import { useDashboardTaskMetrics } from '@/hooks/useDashboardTaskMetrics'
import { type DashboardStatusFilter } from '@/lib/dashboard/dashboardHelpers'
import {
  fetchRecentBuildingConversations,
  type RecentBuildingConversation,
} from '@/lib/messages/messageService'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type DashboardTask = EditableTask

export function useDashboardPage(selectedBuildingId?: string | null) {
  const isHomeSelection = !selectedBuildingId?.trim()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null)
  const [compactHeader, setCompactHeader] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] =
    useState<DashboardStatusFilter>('all')
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)

  const scrollRef = useRef<HTMLElement | null>(null)
  const {
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
  } = useDashboardData({ selectedBuildingId })
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
  }, [setRecentConversations])

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
    [setRecentConversations]
  )

  const closeModal = () => {
    setModalOpen(false)
    setSelectedTask(null)
  }

  useEffect(() => {
    if (!isHomeSelection) return

    const timeoutId = window.setTimeout(() => {
      setExpandedTaskId(null)
      setShowOverdueTasks(false)
      setStatusFilter('all')
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isHomeSelection])

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

  const {
    pendingCount,
    urgentCount,
    completedCount,
    completedTasks,
    overdueTasks,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    nextTask,
    todayUrgentCount,
    activeFilterLabel,
  } = useDashboardTaskMetrics({
    tasks,
    statusFilter,
  })

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
