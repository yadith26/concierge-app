'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, MessageSquareMore, BellDot } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import TaskInventoryFlowModals from '@/components/tasks/TaskInventoryFlowModals'
import TaskStatusReasonModal from '@/components/tasks/TaskStatusReasonModal'
import TasksFilterBar from '@/components/tasks/TasksFilterBar'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import TasksEmptyState from '@/components/tasks/TasksEmptyState'
import TasksPageSections from '@/components/tasks/TasksPageSections'
import TaskStatusSummaryCard from '@/components/tasks/TaskStatusSummaryCard'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import { useTasksPage } from '@/hooks/useTasksPage'
import { useTaskInventoryCompletion } from '@/hooks/useTaskInventoryCompletion'
import { useTaskReopenReason } from '@/hooks/useTaskReopenReason'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'
import { exportTasksToExcel } from '@/lib/tasks/exportTasksToExcel'
import { requiresInventoryFlow } from '@/lib/inventory/taskInventoryCategories'

export default function TasksPage() {
  const tGlobal = useTranslations()
  const t = useTranslations('tasksPage')
  const reopenReasonT = useTranslations('taskStatusReasonModal')
  const headerT = useTranslations('conciergeHeader')
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
  const [undoComplete, setUndoComplete] = useState<{
    taskId: string
    taskTitle: string
    previousStatus: 'pending' | 'in_progress'
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

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
    return () => {
      if (undoComplete) {
        clearTimeout(undoComplete.timeoutId)
      }
    }
  }, [undoComplete])

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

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    if (!requiresInventoryFlow(task.category)) {
      if (undoComplete) {
        clearTimeout(undoComplete.timeoutId)
      }

      const didComplete = await updateTaskStatus(task.id, 'completed')
      if (!didComplete) return

      const timeoutId = setTimeout(() => {
        setUndoComplete((current) =>
          current?.taskId === task.id ? null : current
        )
      }, 5000)

      setUndoComplete({
        taskId: task.id,
        taskTitle: task.title,
        previousStatus: task.status === 'in_progress' ? 'in_progress' : 'pending',
        timeoutId,
      })
      return
    }

    await taskInventory.requestCompletion(task, updateTaskStatus)
  }

  const handleSwipeCompleteTask = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    if (requiresInventoryFlow(task.category)) {
      await taskInventory.requestCompletion(task, updateTaskStatus)
      return
    }

    if (undoComplete) {
      clearTimeout(undoComplete.timeoutId)
    }

    const didComplete = await updateTaskStatus(task.id, 'completed')
    if (!didComplete) return

    const timeoutId = setTimeout(() => {
      setUndoComplete((current) =>
        current?.taskId === task.id ? null : current
      )
    }, 5000)

    setUndoComplete({
      taskId: task.id,
      taskTitle: task.title,
      previousStatus: task.status === 'in_progress' ? 'in_progress' : 'pending',
      timeoutId,
    })
  }

  const undoCompletedTask = async () => {
    if (!undoComplete) return

    clearTimeout(undoComplete.timeoutId)
    const { taskId, previousStatus } = undoComplete
    setUndoComplete(null)
    await updateTaskStatus(taskId, previousStatus)
  }

  const handleSetPendingTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    if (task.status === 'completed') {
      reopenReason.requestReopen({
        taskTitle: task.title,
        onConfirm: (reason) => updateTaskStatus(task.id, 'pending', reason),
      })
      return
    }

    void updateTaskStatus(taskId, 'pending')
  }
  if (loading) {
    return (
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md items-center justify-center bg-[#F6F8FC]">
          <p className="text-[#6E7F9D]">{t('loading')}</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <PageHeader
            compact={compactHeader}
            title={t('title')}
            showUserButton
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 20 : 24} />,
                    label: headerT('openMessages'),
                    count: headerConversation.unreadCount,
                    onClick: () => {
                      void headerConversation.openInbox()
                    },
                  }
                : null
            }
            rightSlot={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void ownerRequests.openModal()
                  }}
                  className={`relative shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm ${
                    ownerRequests.openCount > 0
                      ? 'border-[#F6D48B] bg-[#FFF7E3] text-[#B7791F] hover:bg-[#FFF3D6]'
                      : 'border-[#D9E0EA] bg-white/88 text-[#6E7F9D] hover:bg-white'
                  } ${
                    compactHeader
                      ? 'flex h-11 w-11 items-center justify-center rounded-[22px]'
                      : 'flex h-14 w-14 items-center justify-center rounded-[22px]'
                  }`}
                  aria-label={headerT('openManagerEvents')}
                >
                  <BellDot size={compactHeader ? 20 : 22} />
                  {ownerRequests.openCount > 0 ? (
                    <span className={`absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none text-white ${
                      ownerRequests.unreadCount > 0 ? 'bg-[#D64555]' : 'bg-[#D4A017]'
                    }`}>
                      {ownerRequests.openCount > 9 ? '9+' : ownerRequests.openCount}
                    </span>
                  ) : null}
                </button>

                {compactHeader ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
                    aria-label={t('newTask')}
                  >
                    <Plus size={22} />
                  </button>
                ) : null}
              </div>
            }
          >
            <ManagerBuildingChip
              buildingId={buildingId}
              buildingName={buildingName || t('noBuilding')}
              buildings={buildings}
              getBuildingHref={(nextBuildingId) =>
                `/tasks?buildingId=${nextBuildingId}`
              }
              label={t('building')}
              mainHref="/dashboard"
              mainLabel={headerT('allBuildings')}
              mainDescription={headerT('backToOverview')}
              size="compact"
              singleBuildingMode="static"
            />

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-[28px] bg-[#3E63E6] px-5 py-3.5 text-[17px] font-semibold text-white shadow-[0_16px_30px_rgba(62,99,230,0.28)] hover:bg-[#3558D8]"
            >
              <Plus size={26} />
              {t('newTask')}
            </button>
          </PageHeader>

          <section
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 pb-28 pt-3"
          >
            <div className="space-y-4">
              <TasksFilterBar
                search={search}
                onSearchChange={setSearch}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                categoryOpen={categoryOpen}
                onToggleCategory={() => setCategoryOpen((prev) => !prev)}
                onCloseCategory={() => setCategoryOpen(false)}
                categoryRef={categoryRef}
                counts={counts}
                onExport={() => {
                  void exportTasksToExcel({
                    tasks: filteredTasks,
                    buildingName: buildingName || t('noBuilding'),
                    locale,
                    t: tGlobal,
                  })
                }}
              />

              {(statusFilter === 'all' || statusFilter === 'pending') && !showingOnlyOverdue && !showingOnlyCompleted ? (
                <TaskStatusSummaryCard
                  count={counts.pendingCount}
                  title={t('pendingSummary.title')}
                  subtitle={
                    statusFilter === 'pending'
                      ? t('pendingSummary.showing')
                      : t('pendingSummary.tapToView')
                  }
                  active={statusFilter === 'pending'}
                  onClick={() => {
                    setStatusFilter((current) =>
                      current === 'pending' ? 'all' : 'pending'
                    )
                    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              ) : null}

              <TasksPageSections
                key={statusFilter}
                statusFilter={statusFilter}
                focusSectionKey={focusSectionKey}
                filteredTasks={filteredTasks}
                expandedTaskId={expandedTaskId}
                setExpandedTaskId={setExpandedTaskId}
                todayTasks={todayTasks}
                tomorrowTasks={tomorrowTasks}
                upcomingTasks={upcomingTasks}
                overdueTasks={overdueTasks}
                completedTasks={completedTasks}
                showingOnlyOverdue={showingOnlyOverdue}
                showingOnlyCompleted={showingOnlyCompleted}
                onComplete={handleCompleteTask}
                onSwipeComplete={handleSwipeCompleteTask}
                onSetInProgress={(id) => updateTaskStatus(id, 'in_progress')}
                onSetPending={handleSetPendingTask}
                onDelete={queueDeleteTask}
                onEdit={openEditModal}
              />

              {filteredTasks.length === 0 && <TasksEmptyState />}
            </div>
          </section>

          <BottomNav active="tasks" buildingId={buildingId} />

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
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title={headerT('messagesTitle')}
        subtitle={headerConversation.contactName || headerT('noAssignedContact')}
        currentUserId={headerConversation.currentUserId}
        messages={headerConversation.messages}
        value={headerConversation.value}
        sending={headerConversation.sending}
        loading={headerConversation.loadingConversation}
        error={headerConversation.error}
        onChange={headerConversation.setValue}
        onClose={headerConversation.closeConversation}
        onSubmit={() => {
          void headerConversation.sendMessage()
        }}
        canSaveAsTask
        onSaveAsTask={(message) => {
          setRequestTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setRequestSourceId(null)
          headerConversation.closeConversation()
          openCreateModal()
        }}
      />

      <GlobalMessagesInboxModal
        open={headerConversation.inboxOpen}
        conversations={headerConversation.inboxConversations}
        loading={headerConversation.loadingInbox}
        onClose={headerConversation.closeInbox}
        onSelect={(conversation) => {
          void headerConversation.openInboxConversation(conversation)
        }}
      />

      <OwnerRequestsModal
        open={ownerRequests.modalOpen}
        loading={ownerRequests.loading}
        error={ownerRequests.error}
        requests={ownerRequests.requests}
        onClose={ownerRequests.closeModal}
        onArchive={(requestId) => {
          void ownerRequests.archiveRequest(requestId)
        }}
        onConvert={(request) => {
          setRequestTaskDraft(ownerRequests.toTaskDraft(request))
          setRequestSourceId(request.id)
          ownerRequests.closeModal()
          openCreateModal()
        }}
      />

      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          closeModal()
          setRequestTaskDraft(null)
          setRequestSourceId(null)
        }}
        buildingId={buildingId}
        profileId={profileId}
        onCreated={async () => {
          if (requestSourceId) {
            await ownerRequests.markConverted(requestSourceId)
          }
          await fetchTasksData()
          await ownerRequests.reloadRequests()
        }}
        taskToEdit={selectedTask}
        initialValues={selectedTask ? null : requestTaskDraft}
        sourceRequestId={requestSourceId}
      />

      <TaskInventoryFlowModals taskInventory={taskInventory} />

      <TaskStatusReasonModal
        open={reopenReason.open}
        taskTitle={reopenReason.taskTitle}
        reason={reopenReason.reason}
        error={reopenReason.error}
        saving={reopenReason.saving}
        onChangeReason={reopenReason.setReason}
        onClose={reopenReason.close}
        onConfirm={() => {
          void reopenReason.confirm()
        }}
      />
    </>
  )
}
