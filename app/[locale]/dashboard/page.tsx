'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Camera, Mic, PhoneCall, Plus } from 'lucide-react'

import ConciergeDashboardHeader from '@/components/dashboard/ConciergeDashboardHeader'
import DashboardFloatingAddButton from '@/components/dashboard/DashboardFloatingAddButton'
import DashboardUndoToast from '@/components/dashboard/DashboardUndoToast'
import {
  ConciergeDashboardBuildingView,
  ConciergeDashboardHomeView,
  type DashboardQuickAction,
} from '@/components/dashboard/ConciergeDashboardViews'
import BottomNav from '@/components/layout/BottomNav'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import TaskInventoryFlowModals from '@/components/tasks/TaskInventoryFlowModals'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import TaskStatusReasonModal from '@/components/tasks/TaskStatusReasonModal'
import { useConciergeDashboardView } from '@/hooks/useConciergeDashboardView'
import { useDashboardCommunication } from '@/hooks/useDashboardCommunication'
import { useDashboardCreateActions } from '@/hooks/useDashboardCreateActions'
import { useDashboardInsights } from '@/hooks/useDashboardInsights'
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation'
import { useDashboardPage } from '@/hooks/useDashboardPage'
import { useDashboardTaskCompletion } from '@/hooks/useDashboardTaskCompletion'
import { useTaskReopenReason } from '@/hooks/useTaskReopenReason'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import { useTaskInventoryCompletion } from '@/hooks/useTaskInventoryCompletion'
import { getConciergeDashboardCopy } from '@/lib/dashboard/dashboardCopy'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import { toEditableTask } from '@/lib/tasks/taskHelpers'
import { getPriorityKey } from '@/lib/tasks/taskLabels'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const labelT = useTranslations('taskLabels')
  const reopenReasonT = useTranslations('taskStatusReasonModal')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const routeSelectedBuildingId = searchParams.get('buildingId')
  const shouldOpenMessages = searchParams.get('openMessages') === '1'
  const [expandedHotAreaKey, setExpandedHotAreaKey] = useState<string | null>(null)

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
    recentConversations,
    messagesModalOpen,
    conversationMessages,
    conversationDraft,
    conversationError,
    conversationLoading,
    conversationSending,
    unreadMessageCount,
    modalOpen,
    selectedTask,
    compactHeader,
    homeBuildings,
    homeSummary,
    homeTasks,
    isConciergeHome,
    expandedTaskId,
    undoDelete,
    urgentCount,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    nextTask,
    scrollRef,
    setExpandedTaskId,
    setMessagesModalOpen,
    setConversationDraft,
    openConversation,
    markRecentConversationRead,
    openCreateModal,
    openEditModal,
    closeModal,
    updateTaskStatus,
    sendConversationMessage,
    fetchDashboardData,
    queueDeleteTask,
    undoDeleteTask,
  } = useDashboardPage(routeSelectedBuildingId)

  const dashboardView = useConciergeDashboardView({
    selectedBuildingId: routeSelectedBuildingId,
    isConciergeHome,
  })
  const { isHomeView, selectedBuildingId } = dashboardView
  const showBottomNav = !isHomeView || homeBuildings.length <= 1

  const taskInventory = useTaskInventoryCompletion({ buildingId, profileId })
  const navigation = useDashboardNavigation({ buildingId })
  const communication = useDashboardCommunication({
    buildingId,
    isHomeView,
    managerContact,
    recentConversations,
    shouldOpenMessages,
    openConversation,
    markRecentConversationRead,
    openBuildingMessages: navigation.openBuildingMessages,
    openMessagesForBuilding: navigation.openMessagesForBuilding,
  })
  const {
    requestTaskDraft,
    requestSourceId,
    quickPhotoFile,
    quickPhotoInputRef,
    dictationError,
    isListening,
    isTranscribing,
    setRequestTaskDraft,
    setRequestSourceId,
    clearDictationError,
    openDictateTask,
    openQuickPhotoCamera,
    handleQuickPhotoSelected,
    resetCreateContext,
  } = useDashboardCreateActions({
    locale,
    openCreateModal,
  })

  useSyncConciergeBuildingUrl({
    buildingId,
    path: '/dashboard',
    selectedBuildingId,
  })

  const {
    undoComplete,
    requestTaskCompletion,
    requestTaskSwipeCompletion,
    undoCompletedTask,
  } = useDashboardTaskCompletion({
    tasks,
    updateTaskStatus,
    taskInventory,
  })
  const reopenReason = useTaskReopenReason({
    requiredMessage: reopenReasonT('required'),
    failedMessage: reopenReasonT('failed'),
  })

  const copy = useMemo(() => getConciergeDashboardCopy(locale), [locale])

  const {
    spotlightTask,
    spotlightReason,
    completedTodayTasks,
    activeProblems,
    todayDashboardTasks,
    smartReminders,
    hotAreas,
  } = useDashboardInsights({
    copy,
    locale,
    tasks,
    completedTasks,
    overdueTasks,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
    nextTask,
  })

  const quickActions = useMemo<DashboardQuickAction[]>(
    () => [
      {
        key: 'new-task',
        label: 'Nueva\ntarea',
        icon: <Plus size={24} />,
        tone: 'blue',
        onClick: openCreateModal,
      },
      {
        key: 'dictate-task',
        label: 'Dictar\ntarea',
        icon: <Mic size={24} />,
        tone: 'green',
        onClick: openDictateTask,
      },
      {
        key: 'quick-photo',
        label: 'Foto\nrápida',
        icon: <Camera size={24} />,
        tone: 'violet',
        onClick: openQuickPhotoCamera,
      },
      ...(managerContact
        ? [
            {
              key: 'call-manager',
              label: 'Llamar\nmanager',
              icon: <PhoneCall size={24} />,
              tone: 'green' as const,
              onClick: () => void openConversation(),
            },
          ]
        : []),
    ],
    [
      managerContact,
      openConversation,
      openCreateModal,
      openDictateTask,
      openQuickPhotoCamera,
    ]
  )

  const handleSetPendingTask = (task: (typeof tasks)[number]) => {
    if (task.status === 'completed') {
      reopenReason.requestReopen({
        taskTitle: task.title,
        onConfirm: (reason) => updateTaskStatus(task.id, 'pending', reason),
      })
      return
    }

    void updateTaskStatus(task.id, 'pending')
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
          <ConciergeDashboardHeader
            compact={isHomeView ? false : compactHeader}
            isHomeView={isHomeView}
            userName={userName}
            subtitle={copy.subtitle}
            avatarKey={avatarKey}
            profilePhotoUrl={profilePhotoUrl}
            canOpenMessages={communication.canOpenMessages}
            globalUnreadMessageCount={communication.globalUnreadMessageCount}
            unreadMessageCount={unreadMessageCount}
            onOpenMessages={communication.openMessagesInbox}
            showOwnerRequests={Boolean(managerContact)}
            ownerRequestsOpenCount={communication.ownerRequests.openCount}
            ownerRequestsUnreadCount={communication.ownerRequests.unreadCount}
            onOpenOwnerRequests={() => {
              void communication.ownerRequests.openModal()
            }}
            buildingId={buildingId}
            buildingName={buildingName}
            buildings={buildings}
            showManagerNotLinkedMessage={!isHomeView && !managerContact}
            managerNotLinkedMessage={t('managerNotLinkedShort')}
            todayTasksCount={todayTasks.length}
            urgentCount={urgentCount}
            overdueCount={overdueTasks.length}
            onOpenTodayTasks={navigation.openTodayTasks}
            onOpenUrgentTasks={navigation.openUrgentTasks}
            onOpenOverdueTasks={navigation.openOverdueTasks}
          />

          <section
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 pb-36 pt-3"
          >
            {isHomeView ? (
              <ConciergeDashboardHomeView
                buildings={homeBuildings}
                summary={homeSummary}
                tasksByStatus={homeTasks}
                onOpenBuilding={navigation.openBuildingDashboard}
                onOpenTask={navigation.openSummaryTask}
              />
            ) : (
              <ConciergeDashboardBuildingView
                copy={copy}
                locale={locale}
                quickActions={quickActions}
                expandedTaskId={expandedTaskId}
                expandedHotAreaKey={expandedHotAreaKey}
                spotlightTask={spotlightTask}
                spotlightReason={spotlightReason}
                todayDashboardTasks={todayDashboardTasks}
                activeProblems={activeProblems}
                smartReminders={smartReminders}
                hotAreas={hotAreas}
                completedTodayTasks={completedTodayTasks}
                noLocationLabel={t('noLocation')}
                priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                onToggleExpandTask={(task) =>
                  setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                }
                onToggleHotArea={(itemKey) =>
                  setExpandedHotAreaKey((prev) => (prev === itemKey ? null : itemKey))
                }
                onCompleteTask={(task) => void requestTaskCompletion(task)}
                onSwipeCompleteTask={(task) => void requestTaskSwipeCompletion(task)}
                onOpenTask={openEditModal}
                onSetPendingTask={handleSetPendingTask}
                onSetInProgressTask={(task) =>
                  void updateTaskStatus(task.id, 'in_progress')
                }
                onDeleteTask={queueDeleteTask}
                onOpenTodayTasks={navigation.openTodayTasks}
                onOpenProblems={navigation.openProblems}
                onOpenAgenda={navigation.openAgenda}
                onOpenAllTasks={navigation.openAllTasks}
              />
            )}
          </section>

          {showBottomNav ? (
            <BottomNav
              active="dashboard"
              buildingId={isHomeView ? undefined : buildingId}
            />
          ) : null}

          {!isHomeView ? (
            <DashboardFloatingAddButton onClick={openCreateModal} />
          ) : null}

          {undoDelete ? (
            <DashboardUndoToast
              title="Tarea eliminada"
              subtitle={undoDelete.task.title}
              actionLabel="Deshacer"
              onAction={undoDeleteTask}
            />
          ) : null}

          {!undoDelete && undoComplete ? (
            <DashboardUndoToast
              title="Tarea completada"
              subtitle={undoComplete.taskTitle}
              actionLabel="Deshacer"
              onAction={() => {
                void undoCompletedTask()
              }}
            />
          ) : null}

          {!undoDelete && !undoComplete && dictationError ? (
            <DashboardUndoToast
              title="Problema con dictado"
              subtitle={dictationError}
              actionLabel="Cerrar"
              onAction={clearDictationError}
            />
          ) : null}
        </div>
      </main>

      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          closeModal()
          resetCreateContext()
        }}
        buildingId={buildingId}
        profileId={profileId}
        onCreated={async () => {
          if (requestSourceId) {
            await communication.ownerRequests.markConverted(requestSourceId)
          }
          await fetchDashboardData()
          await communication.ownerRequests.reloadRequests()
        }}
        taskToEdit={selectedTask ? toEditableTask(selectedTask) : null}
        initialValues={selectedTask ? null : requestTaskDraft}
        initialPhotoFile={quickPhotoFile}
        sourceRequestId={requestSourceId}
      />

      <ConversationModal
        open={messagesModalOpen}
        title="Conversacion"
        subtitle={managerContact ? managerContact.name : 'Manager del edificio'}
        currentUserId={profileId}
        messages={conversationMessages}
        value={conversationDraft}
        sending={conversationSending}
        loading={conversationLoading}
        error={conversationError}
        onChange={setConversationDraft}
        onClose={() => setMessagesModalOpen(false)}
        onSubmit={sendConversationMessage}
        canSaveAsTask
        onSaveAsTask={(message) => {
          setRequestTaskDraft(buildTaskDraftFromMessage({ message, locale }))
          setRequestSourceId(null)
          setMessagesModalOpen(false)
          openCreateModal()
        }}
      />

      <GlobalMessagesInboxModal
        open={communication.messagesInboxOpen}
        conversations={recentConversations}
        onClose={communication.closeMessagesInbox}
        onSelect={communication.selectInboxConversation}
      />

      <OwnerRequestsModal
        open={communication.ownerRequests.modalOpen}
        loading={communication.ownerRequests.loading}
        error={communication.ownerRequests.error}
        requests={communication.ownerRequests.requests}
        onClose={communication.ownerRequests.closeModal}
        onArchive={(requestId) => {
          void communication.ownerRequests.archiveRequest(requestId)
        }}
        onConvert={(request) => {
          setRequestTaskDraft(communication.ownerRequests.toTaskDraft(request))
          setRequestSourceId(request.id)
          communication.ownerRequests.closeModal()
          openCreateModal()
        }}
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

      <input
        ref={quickPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleQuickPhotoSelected}
      />

      {isListening || isTranscribing ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white px-8 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <div className="relative flex h-20 w-20 items-center justify-center">
              {isListening ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              ) : null}
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white ${
                  isListening ? 'bg-green-500' : 'bg-[#4B63DF]'
                }`}
              >
                <Mic size={28} />
              </span>
            </div>

            <p className="text-[16px] font-semibold text-[#142952]">
              {isListening ? 'Grabando audio...' : 'Transcribiendo...'}
            </p>

            <p className="text-center text-[13px] text-[#6E7F9D]">
              Habla ahora, se detendrá automáticamente
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
