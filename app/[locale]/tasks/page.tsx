'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import TasksPageContent from '@/components/tasks/TasksPageContent'
import TasksPageHeader from '@/components/tasks/TasksPageHeader'
import TasksPageModals from '@/components/tasks/TasksPageModals'
import BottomNav from '@/components/layout/BottomNav'
import ConciergePageShell from '@/components/layout/ConciergePageShell'
import { useTasksPage } from '@/hooks/useTasksPage'
import { useTaskInventoryCompletion } from '@/hooks/useTaskInventoryCompletion'
import { useTaskReopenReason } from '@/hooks/useTaskReopenReason'
import { useConciergeTaskActions } from '@/hooks/useConciergeTaskActions'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'
import { exportTasksToExcel } from '@/lib/tasks/exportTasksToExcel'

export default function TasksPage() {
  const tGlobal = useTranslations()
  const t = useTranslations('tasksPage')
  const reopenReasonT = useTranslations('taskStatusReasonModal')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const selectedBuildingId = searchParams.get('buildingId')
  const selectedFilter = searchParams.get('filter')
  const selectedTaskId = searchParams.get('taskId')
  const headerConversation = useHeaderConversation({
    preferredBuildingId: selectedBuildingId || undefined,
  })
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)
  const {
    loading,
    tasks,
    buildingName,
    buildings,
    buildingId,
    profileId,
    modalOpen,
    selectedTask,
    filteredTasks,
    statusFilter,
    categoryOpen,
    compactHeader,
    expandedTaskId,
    undoDelete,
    counts,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    showingOnlyOverdue,
    showingOnlyCompleted,
    search,
    categoryFilter,
    setSearch,
    setStatusFilter,
    setCategoryFilter,
    setCategoryOpen,
    setCompactHeader,
    setExpandedTaskId,
    fetchTasksData,
    openCreateModal,
    openEditModal,
    closeModal,
    updateTaskStatus,
    queueDeleteTask,
    undoDeleteTask,
  } = useTasksPage(selectedBuildingId)
  const taskInventory = useTaskInventoryCompletion({ buildingId, profileId })
  const reopenReason = useTaskReopenReason({
    requiredMessage: reopenReasonT('required'),
    failedMessage: reopenReasonT('failed'),
  })
  const {
    undoComplete,
    completeTaskById,
    swipeCompleteTaskById,
    setPendingTaskById,
    undoCompletedTask,
  } = useConciergeTaskActions({
    tasks,
    updateTaskStatus,
    taskInventory,
    reopenReason,
  })

  const ownerRequests = useOwnerRequestsInbox(buildingId)
  const categoryRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLElement | null>(null)

  useSyncConciergeBuildingUrl({
    buildingId,
    path: '/tasks',
    selectedBuildingId,
  })

  useEffect(() => {
    if (!selectedFilter) return

    if (
      selectedFilter === 'today' ||
      selectedFilter === 'pending' ||
      selectedFilter === 'in_progress' ||
      selectedFilter === 'completed' ||
      selectedFilter === 'urgent' ||
      selectedFilter === 'overdue'
    ) {
      setStatusFilter(selectedFilter)
    }
  }, [selectedFilter, setStatusFilter])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setCategoryOpen])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      const isCompact = element.scrollTop > 18
      setCompactHeader(isCompact)

      if (isCompact) {
        setCategoryOpen(false)
      }
    }

    handleScroll()
    element.addEventListener('scroll', handleScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [loading, setCompactHeader, setCategoryOpen])

  useEffect(() => {
    if (!selectedTaskId) return
    if (!filteredTasks.some((task) => task.id === selectedTaskId)) return

    setExpandedTaskId(selectedTaskId)

    const timeoutId = window.setTimeout(() => {
      const element = document.getElementById(`task-${selectedTaskId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 180)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [filteredTasks, selectedTaskId, setExpandedTaskId])

  const focusedTask = useMemo(
    () => filteredTasks.find((task) => task.id === selectedTaskId) || null,
    [filteredTasks, selectedTaskId]
  )

  const focusSectionKey = useMemo(() => {
    if (!focusedTask) return null
    if (focusedTask.status === 'completed') return 'completed' as const
    if (statusFilter === 'pending') return 'pending' as const
    if (statusFilter === 'overdue') return 'overdue' as const
    if (statusFilter === 'today') return 'today' as const
    if (overdueTasks.some((task) => task.id === focusedTask.id)) return 'overdue' as const
    if (todayTasks.some((task) => task.id === focusedTask.id)) return 'today' as const
    if (tomorrowTasks.some((task) => task.id === focusedTask.id)) return 'tomorrow' as const
    if (upcomingTasks.some((task) => task.id === focusedTask.id)) return 'upcoming' as const
    if (completedTasks.some((task) => task.id === focusedTask.id)) return 'completed' as const
    return null
  }, [
    completedTasks,
    focusedTask,
    overdueTasks,
    statusFilter,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
  ])

  return (
    <>
      <ConciergePageShell
        loading={loading}
        loadingLabel={t('loading')}
        bottomNav={<BottomNav active="tasks" buildingId={buildingId} />}
      >
        <TasksPageHeader
          compact={compactHeader}
          buildingId={buildingId}
          buildingName={buildingName}
          buildings={buildings}
          canOpenConversation={headerConversation.canOpenConversation}
          unreadMessageCount={headerConversation.unreadCount}
          ownerRequestsOpenCount={ownerRequests.openCount}
          ownerRequestsUnreadCount={ownerRequests.unreadCount}
          onOpenConversationInbox={() => {
            void headerConversation.openInbox()
          }}
          onOpenOwnerRequests={() => {
            void ownerRequests.openModal()
          }}
          onOpenCreate={openCreateModal}
        />

        <TasksPageContent
          scrollRef={scrollRef}
          categoryRef={categoryRef}
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryOpen={categoryOpen}
          onToggleCategory={() => setCategoryOpen((prev) => !prev)}
          onCloseCategory={() => setCategoryOpen(false)}
          counts={counts}
          onExport={() => {
            void exportTasksToExcel({
              tasks: filteredTasks,
              buildingName: buildingName || t('noBuilding'),
              locale,
              t: tGlobal,
            })
          }}
          showingOnlyOverdue={showingOnlyOverdue}
          showingOnlyCompleted={showingOnlyCompleted}
          onTogglePendingSummary={() => {
            setStatusFilter((current) =>
              current === 'pending' ? 'all' : 'pending'
            )
            scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          pendingSummaryTitle={t('pendingSummary.title')}
          pendingSummarySubtitle={
            statusFilter === 'pending'
              ? t('pendingSummary.showing')
              : t('pendingSummary.tapToView')
          }
          focusSectionKey={focusSectionKey}
          filteredTasks={filteredTasks}
          expandedTaskId={expandedTaskId}
          setExpandedTaskId={setExpandedTaskId}
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
          upcomingTasks={upcomingTasks}
          overdueTasks={overdueTasks}
          completedTasks={completedTasks}
          onComplete={completeTaskById}
          onSwipeComplete={swipeCompleteTaskById}
          onSetInProgress={(id) => updateTaskStatus(id, 'in_progress')}
          onSetPending={setPendingTaskById}
          onDelete={queueDeleteTask}
          onEdit={openEditModal}
        />

          {undoDelete ? (
            <UndoDeleteToast
              taskTitle={undoDelete.task.title}
              onUndo={undoDeleteTask}
            />
          ) : null}

          {!undoDelete && undoComplete ? (
            <UndoDeleteToast
              title={t('undoCompleteTitle')}
              taskTitle={undoComplete.taskTitle}
              actionLabel={t('undo')}
              onUndo={() => {
                void undoCompletedTask()
              }}
            />
          ) : null}
      </ConciergePageShell>

      <TasksPageModals
        headerConversation={headerConversation}
        ownerRequests={ownerRequests}
        taskInventory={taskInventory}
        reopenReason={reopenReason}
        modalOpen={modalOpen}
        selectedTask={selectedTask}
        requestTaskDraft={requestTaskDraft}
        requestSourceId={requestSourceId}
        buildingId={buildingId}
        profileId={profileId}
        onSaveMessageAsTask={(message) => {
          setRequestTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setRequestSourceId(null)
          headerConversation.closeConversation()
          openCreateModal()
        }}
        onConvertOwnerRequest={(request) => {
          setRequestTaskDraft(ownerRequests.toTaskDraft(request))
          setRequestSourceId(request.id)
          ownerRequests.closeModal()
          openCreateModal()
        }}
        onCloseTaskModal={() => {
          closeModal()
          setRequestTaskDraft(null)
          setRequestSourceId(null)
        }}
        onCreated={async () => {
          if (requestSourceId) {
            await ownerRequests.markConverted(requestSourceId)
          }
          await fetchTasksData()
          await ownerRequests.reloadRequests()
        }}
      />
    </>
  )
}
