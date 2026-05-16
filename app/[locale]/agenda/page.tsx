'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import BottomNav from '@/components/layout/BottomNav'
import ConciergePageShell from '@/components/layout/ConciergePageShell'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import AgendaCalendar from '@/components/agenda/AgendaCalendar'
import AgendaDayPanel from '@/components/agenda/AgendaDayPanel'
import AgendaQuickView from '@/components/agenda/AgendaQuickView'
import AgendaPageHeader from '@/components/agenda/AgendaPageHeader'
import AgendaPageModals from '@/components/agenda/AgendaPageModals'
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
        <AgendaPageHeader
          compact={compactHeader}
          buildingId={buildingId}
          buildingName={buildingName}
          buildings={buildings}
          selectedDateLabel={selectedDateLabel}
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
          onGoToToday={handleGoToTodayAndScroll}
        />

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

      <AgendaPageModals
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
        defaultDate={selectedDate || todayKey}
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
          await fetchData()
          await ownerRequests.reloadRequests()
        }}
      />
    </>
  )
}
