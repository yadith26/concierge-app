'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, CalendarDays, MessageSquareMore, BellDot } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import BottomNav from '@/components/layout/BottomNav'
import ConciergePageShell from '@/components/layout/ConciergePageShell'
import PageHeader from '@/components/layout/PageHeader'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import TaskInventoryFlowModals from '@/components/tasks/TaskInventoryFlowModals'
import TaskStatusReasonModal from '@/components/tasks/TaskStatusReasonModal'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import AgendaCalendar from '@/components/agenda/AgendaCalendar'
import AgendaQuickView from '@/components/agenda/AgendaQuickView'
import AgendaDayPanel from '@/components/agenda/AgendaDayPanel'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import { useAgendaPage } from '@/hooks/useAgendaPage'
import { useAgendaSwipe } from '@/hooks/useAgendaSwipe'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import { useTaskInventoryCompletion } from '@/hooks/useTaskInventoryCompletion'
import { useTaskReopenReason } from '@/hooks/useTaskReopenReason'
import { useConciergeTaskActions } from '@/hooks/useConciergeTaskActions'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

export default function AgendaPage() {
  const t = useTranslations('agendaPage')
  const reopenReasonT = useTranslations('taskStatusReasonModal')
  const nextTaskT = useTranslations('agendaNextTask')
  const headerT = useTranslations('conciergeHeader')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const selectedBuildingId = searchParams.get('buildingId')
  const headerConversation = useHeaderConversation({
    preferredBuildingId: selectedBuildingId || undefined,
  })
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)
  const {
    loading,
    selectedDate,
    modalOpen,
    selectedTask,
    buildingId,
    buildingName,
    buildings,
    profileId,
    animDirection,
    expandedTaskId,
    setExpandedTaskId,
    days,
    tasksForDay,
    groupedTasks,
    quickViewTasks,
    quickViewStats,
    nextTaskCard,
    selectedDateLabel,
    selectedStats,
    monthlyStats,
    monthLabel,
    todayKey,
    fetchData,
    updateTaskStatus,
    deleteTask,
    undoDelete,
    undoDeleteTask,
    changeMonth,
    goToToday,
    handleSelectDate,
    openCreateModal,
    openEditModal,
    closeModal,
    handleExportMonth,
  } = useAgendaPage(selectedBuildingId)
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
    tasks: tasksForDay,
    updateTaskStatus,
    taskInventory,
    reopenReason,
  })

  const ownerRequests = useOwnerRequestsInbox(buildingId)
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const agendaBlockRef = useRef<HTMLDivElement | null>(null)

  useSyncConciergeBuildingUrl({
    buildingId,
    path: '/agenda',
    selectedBuildingId,
  })

  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useAgendaSwipe({
      onSwipeLeft: () => changeMonth(1),
      onSwipeRight: () => changeMonth(-1),
    })

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSelectDateAndScroll = (date: string) => {
    handleSelectDate(date)

    requestAnimationFrame(() => {
      agendaBlockRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const handleGoToTodayAndScroll = () => {
    goToToday()

    requestAnimationFrame(() => {
      agendaBlockRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }


  return (
    <>
      <ConciergePageShell
        loading={loading}
        loadingLabel={t('loading')}
        bottomNav={<BottomNav active="agenda" buildingId={buildingId} />}
      >
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
                    onClick={openCreateModal}
                    className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
                    aria-label={t('addTask')}
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
                `/agenda?buildingId=${nextBuildingId}`
              }
              label={headerT('currentBuilding')}
              mainHref="/dashboard"
              mainLabel={headerT('allBuildings')}
              mainDescription={headerT('backToOverview')}
              size="compact"
              singleBuildingMode="static"
            />

            <div className="flex items-center gap-3">
              <div className="inline-flex max-w-full flex-1 items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm">
                <div className="rounded-full bg-[#F3F6FB] p-1.5 text-[#8C9AB3]">
                  <CalendarDays size={15} />
                </div>

                <span className="text-[15px] text-[#6E7F9D]">
                  {t('date')}
                </span>

                <span className="max-w-[170px] truncate text-[15px] font-semibold capitalize text-[#142952]">
                  {selectedDateLabel || t('noDate')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoToTodayAndScroll}
                className="shrink-0 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 text-sm font-semibold text-[#2F66C8] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm hover:bg-[#F7FAFF]"
              >
                {t('goToToday')}
              </button>
            </div>

            <button
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
              <AgendaCalendar
                monthLabel={monthLabel}
                monthlyStats={monthlyStats}
                days={days}
                selectedDate={selectedDate}
                onChangeMonth={changeMonth}
                onSelectDate={handleSelectDateAndScroll}
                onCreateTask={openCreateModal}
                onExportMonth={handleExportMonth}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />

              <div ref={agendaBlockRef} className="space-y-4">
                <AgendaQuickView
                  selectedDate={selectedDate}
                  quickViewStats={quickViewStats}
                  quickViewTasks={quickViewTasks}
                  onCreateTask={openCreateModal}
                />

                {nextTaskCard && (
                  <div className="rounded-[22px] border border-[#E7EDF5] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-[#EEF4FF] p-2 text-[#2F66C8]">
                        <span className="text-[16px]">🕒</span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8C9AB3]">
                          {nextTaskT(nextTaskCard.label)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#142952]">
                          {nextTaskCard.task.title}
                        </p>
                        {nextTaskCard.task.apartment_or_area && (
                          <p className="mt-0.5 text-sm text-[#6E7F9D]">
                            {nextTaskCard.task.apartment_or_area}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <AgendaDayPanel
                  selectedDate={selectedDate}
                  selectedDateLabel={selectedDateLabel}
                  selectedStats={selectedStats}
                  tasksForDay={tasksForDay}
                  groupedTasks={groupedTasks}
                  expandedTaskId={expandedTaskId}
                  setExpandedTaskId={setExpandedTaskId}
                  onComplete={completeTaskById}
                  onSwipeComplete={swipeCompleteTaskById}
                  onSetInProgress={(taskId) =>
                    updateTaskStatus(taskId, 'in_progress')
                  }
                  onSetPending={setPendingTaskById}
                  onDelete={deleteTask}
                  onEdit={openEditModal}
                  onCreateTask={openCreateModal}
                  animDirection={animDirection}
                />
              </div>
            </div>
          </section>

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
          await fetchData()
          await ownerRequests.reloadRequests()
        }}
        taskToEdit={selectedTask}
        initialValues={selectedTask ? null : requestTaskDraft}
        sourceRequestId={requestSourceId}
        defaultDate={selectedDate || todayKey}
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
