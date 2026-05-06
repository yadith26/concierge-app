'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRef } from 'react'

import {
  BellDot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ListTodo,
  MapPin,
  MessageSquareMore,
  Plus,
  Trash2,
    Camera,
  Mic,
  PhoneCall,
} from 'lucide-react'

import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import ConciergeHomeOverview from '@/components/dashboard/ConciergeHomeOverview'
import DashboardFloatingAddButton from '@/components/dashboard/DashboardFloatingAddButton'
import DashboardUndoToast from '@/components/dashboard/DashboardUndoToast'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import TaskInventoryFlowModals from '@/components/tasks/TaskInventoryFlowModals'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import TaskCardExpandedContent from '@/components/tasks/task-card/TaskCardExpandedContent'
import { useDashboardPage } from '@/hooks/useDashboardPage'
import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import useTaskCardSwipe from '@/hooks/useTaskCardSwipe'
import { useTaskInventoryCompletion } from '@/hooks/useTaskInventoryCompletion'
import { requiresInventoryFlow } from '@/lib/inventory/taskInventoryCategories'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import { getTaskDateTime } from '@/lib/dashboard/dashboardHelpers'
import { getTaskCardViewModel } from '@/lib/tasks/taskCardView'
import { toEditableTask } from '@/lib/tasks/taskHelpers'
import { formatTaskDate, getPriorityKey } from '@/lib/tasks/taskLabels'
import type { EditableTask, TaskDraft, TaskPriority } from '@/lib/tasks/taskTypes'

type SpeechRecognitionResultLike = {
  transcript?: string
}

type SpeechRecognitionAlternativeListLike = ArrayLike<SpeechRecognitionResultLike>

type SpeechRecognitionResultListLike = ArrayLike<SpeechRecognitionAlternativeListLike>

type SpeechRecognitionEventLike = Event & {
  results?: SpeechRecognitionResultListLike
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const labelT = useTranslations('taskLabels')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedBuildingId = searchParams.get('buildingId')
  const shouldOpenMessages = searchParams.get('openMessages') === '1'
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)
  const [messagesInboxOpen, setMessagesInboxOpen] = useState(false)
  const [quickPhotoFile, setQuickPhotoFile] = useState<File | null>(null)
  const [, setDictationError] = useState<string | null>(null)
  const [undoComplete, setUndoComplete] = useState<{
    taskId: string
    taskTitle: string
    previousStatus: 'pending' | 'in_progress'
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const [isListening, setIsListening] = useState(false)
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
  } = useDashboardPage(selectedBuildingId)

  const taskInventory = useTaskInventoryCompletion({ buildingId, profileId })
  const ownerRequests = useOwnerRequestsInbox(buildingId, {
    enabled: Boolean(buildingId) && !isConciergeHome,
    initialDelayMs: 300,
  })

  const globalUnreadMessageCount = recentConversations.reduce(
    (total, conversation) => total + conversation.unread_count,
    0
  )

  useSyncConciergeBuildingUrl({
    buildingId,
    path: '/dashboard',
    selectedBuildingId,
  })

  useEffect(() => {
    if (!shouldOpenMessages || !buildingId || !managerContact) return

    void openConversation()
    router.replace(`/dashboard?buildingId=${buildingId}`)
  }, [buildingId, managerContact, openConversation, router, shouldOpenMessages])

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

  const undoCompletedTask = async () => {
    if (!undoComplete) return

    clearTimeout(undoComplete.timeoutId)
    const { taskId, previousStatus } = undoComplete
    setUndoComplete(null)
    await updateTaskStatus(taskId, previousStatus)
  }

  useEffect(() => {
    return () => {
      if (undoComplete) {
        clearTimeout(undoComplete.timeoutId)
      }
    }
  }, [undoComplete])

  const requestTaskCompletion = async (task: EditableTask) => {
    await handleCompleteTask(task.id)
  }

  const requestTaskSwipeCompletion = async (task: EditableTask) => {
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
  const openDictateTask = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    return
  }

  const recognition = new SpeechRecognition()

  recognition.lang = locale.startsWith('en')
    ? 'en-US'
    : locale.startsWith('fr')
      ? 'fr-CA'
      : locale.startsWith('ru')
        ? 'ru-RU'
        : 'es-ES'

  recognition.interimResults = false
  recognition.maxAlternatives = 1

  setIsListening(true)

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim()

    setIsListening(false)

    if (!transcript) {
      return
    }

    setRequestTaskDraft({
      title: transcript,
      description: '',
      apartment_or_area: '',
      category: 'other',
      priority: 'medium',
      task_date: new Date().toLocaleDateString('en-CA'),
      task_time: '',
    })

    openCreateModal()
  }

  recognition.onerror = () => {
    setIsListening(false)
    setDictationError('No se pudo usar el micrófono.')
  }

  recognition.onend = () => {
    setIsListening(false)
  }

  recognition.start()
}
  const openQuickPhotoCamera = () => {
  quickPhotoInputRef.current?.click()
}
const handleQuickPhotoSelected = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0]
  if (!file) return

  setQuickPhotoFile(file)

  // Limpia el input para poder tomar otra foto aunque sea el mismo archivo
  e.target.value = ''

  openCreateModal()
}
  const copy = useMemo(() => getConciergeDashboardCopy(locale), [locale])

  const {
    spotlightTask,
    spotlightReason,
    completedTodayTasks,
    activeProblems,
    todayDashboardTasks,
    smartReminders,
    hotAreas,
  } = useMemo(() => {
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
    const nextSpotlightTask =
      firstUrgentOverdueTask ||
      firstUrgentTodayTask ||
      overdueTasks[0] ||
      todayTasks[0] ||
      firstUrgentUpcomingTask ||
      nextTask ||
      tomorrowTasks[0] ||
      upcomingTasks[0] ||
      null

    const nextSpotlightReason = firstUrgentOverdueTask?.id === nextSpotlightTask?.id
      ? copy.spotlightUrgentOverdue
      : firstUrgentTodayTask?.id === nextSpotlightTask?.id
        ? copy.spotlightUrgentToday
        : overdueTasks[0]?.id === nextSpotlightTask?.id
          ? copy.spotlightOverdue
          : todayTasks[0]?.id === nextSpotlightTask?.id
            ? copy.spotlightToday
            : firstUrgentUpcomingTask?.id === nextSpotlightTask?.id
              ? copy.spotlightUrgentNext
              : nextSpotlightTask
                ? copy.spotlightNext
                : null

    const nextUrgentTasksList = dedupeTasks(
      [...overdueTasks, ...todayTasks, ...tomorrowTasks, ...upcomingTasks].filter(
        isUrgentTask
      )
    )

    const todayKey = new Date().toLocaleDateString('en-CA')
    const nextCompletedTodayTasks = completedTasks
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

    const nextHotAreas = Object.values(
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
      spotlightTask: nextSpotlightTask,
      spotlightReason: nextSpotlightReason,
      completedTodayTasks: nextCompletedTodayTasks,
      activeProblems: dedupeTasks([
        ...nextUrgentTasksList,
        ...overdueTasks,
      ]).slice(0, 3),
      todayDashboardTasks: todayTasks.slice(0, 4),
      smartReminders: dedupeTasks([
        ...tomorrowTasks,
        ...upcomingTasks,
      ]).slice(0, 2),
      hotAreas: nextHotAreas,
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
  
const quickActions: DashboardQuickAction[] = [
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
    onClick:openQuickPhotoCamera,
  },
  {
    key: 'call-manager',
    label: 'Llamar\nmanager',
    icon: <PhoneCall size={24} />,
    tone: 'green',
    onClick: () => void openConversation(),
  },
]
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
          <AppHeader
            compact={compactHeader}
            showGreeting
            userName={userName}
            showDate
            subtitle={!isConciergeHome ? copy.subtitle : undefined}
            
            rightIconLink="/setup-profile"
            avatarKey={avatarKey}
            profilePhotoUrl={profilePhotoUrl}
            secondaryAction={{
              icon: <MessageSquareMore size={compactHeader ? 20 : 22} />,
              label: 'Abrir mensajes',
              count: globalUnreadMessageCount || unreadMessageCount,
              onClick: () => setMessagesInboxOpen(true),
            }}
            rightSlot={
              !isConciergeHome ? (
                <button
                  type="button"
                  onClick={() => {
                    void ownerRequests.openModal()
                  }}
                  className={`relative shrink-0 shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm ${
                    ownerRequests.openCount > 0
                      ? 'border-[#F6D48B] bg-[#FFF7E3] text-[#B7791F] hover:bg-[#FFF3D6]'
                      : 'border-[#D9E0EA] bg-white/85 text-[#6E7F9D] hover:bg-white'
                  } ${
                    compactHeader
                      ? 'flex h-11 w-11 items-center justify-center rounded-[22px]'
                      : 'flex h-14 w-14 items-center justify-center rounded-[22px]'
                  }`}
                  aria-label="Abrir eventos del manager"
                >
                  <BellDot size={compactHeader ? 20 : 22} />
                  {ownerRequests.openCount > 0 ? (
                    <span
                      className={`absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none text-white ${
                        ownerRequests.unreadCount > 0 ? 'bg-[#D64555]' : 'bg-[#D4A017]'
                      }`}
                    >
                      {ownerRequests.openCount > 9 ? '9+' : ownerRequests.openCount}
                    </span>
                  ) : null}
                </button>
              ) : null
            }
           headerContent={
  buildingId && !isConciergeHome ? (
    <>
      <ManagerBuildingChip
        buildingId={buildingId}
        buildingName={buildingName}
        buildings={buildings}
        getBuildingHref={(nextBuildingId) =>
          `/dashboard?buildingId=${nextBuildingId}`
        }
        label="Edificio actual"
        mainHref="/dashboard"
        mainLabel="Mis edificios"
        mainDescription="Volver a la vista general"
        size="compact"
        singleBuildingMode="static"
      />

     <div className="mt-3 flex flex-wrap items-center gap-2">
  <button
    type="button"
    onClick={() => router.push(`/tasks?buildingId=${buildingId}&filter=today`)}
    className="rounded-full bg-white/80 px-3 py-1.5 text-[13px] font-bold text-[#142952] shadow-[0_6px_16px_rgba(20,41,82,0.06)] active:scale-[0.97]"
  >
    {todayTasks.length} pendientes
  </button>

  {urgentCount > 0 ? (
    <button
      type="button"
      onClick={() => router.push(`/tasks?buildingId=${buildingId}&filter=urgent`)}
      className="rounded-full bg-[#FFF4F5]/90 px-3 py-1.5 text-[13px] font-bold text-[#D64555] shadow-[0_6px_16px_rgba(214,69,85,0.08)] active:scale-[0.97]"
    >
      {urgentCount} urgente
    </button>
  ) : null}

  {overdueTasks.length > 0 ? (
    <button
      type="button"
      onClick={() => router.push(`/tasks?buildingId=${buildingId}&filter=overdue`)}
      className="rounded-full bg-[#FFF8E8]/90 px-3 py-1.5 text-[13px] font-bold text-[#D9811E] shadow-[0_6px_16px_rgba(217,129,30,0.08)] active:scale-[0.97]"
    >
      {overdueTasks.length} atrasadas
    </button>
  ) : null}
</div>
    </>
  ) : null
}
/>
          <section
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 pb-36 pt-3"
          >
            {isConciergeHome ? (
              <ConciergeHomeOverview
                buildings={homeBuildings}
                summary={homeSummary}
                tasksByStatus={homeTasks}
                onOpenBuilding={(nextBuildingId) =>
                  router.push(`/dashboard?buildingId=${nextBuildingId}`)
                }
              />
            ) : (
              <div className="space-y-5">
             


                <DashboardSpotlightCard
                  task={spotlightTask}
                  label={copy.spotlight}
                  reason={spotlightReason}
                  expanded={expandedTaskId === spotlightTask?.id}
                  locale={locale}
                  copy={copy}
                  noLocationLabel={t('noLocation')}
                  priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                  onComplete={(task) => void requestTaskCompletion(task)}
                  onSwipeComplete={(task) => void requestTaskSwipeCompletion(task)}
                  onOpenTask={openEditModal}
                  onSetPending={(task) => void updateTaskStatus(task.id, 'pending')}
                  onSetInProgress={(task) =>
                    void updateTaskStatus(task.id, 'in_progress')
                  }
                  onDelete={(task) => queueDeleteTask(task)}
                  onToggleExpand={(task) =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                />

               

                <DashboardQuickActions
                  title={copy.quickActions}
                  actions={quickActions}
                />

                <DashboardWideListCard
                  title={copy.todayTasks}
                  count={todayTasks.length}
                  actionLabel={copy.viewAll}
                  onAction={() => router.push(`/tasks?buildingId=${buildingId}&filter=today`)}
                  emptyLabel={copy.noTodayTasks}
                  expandedTaskId={expandedTaskId}
                  noLocationLabel={t('noLocation')}
                  priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                  onToggleTask={(task) =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onCompleteTask={(task) => void requestTaskCompletion(task)}
                  onSwipeCompleteTask={(task) => void requestTaskSwipeCompletion(task)}
                  onOpenTask={openEditModal}
                  onSetPendingTask={(task) => void updateTaskStatus(task.id, 'pending')}
                  onSetInProgressTask={(task) =>
                    void updateTaskStatus(task.id, 'in_progress')
                  }
                  onDeleteTask={queueDeleteTask}
                  items={todayDashboardTasks.map((task) => {
                    const { categoryMeta } = getTaskCardViewModel(task)
                    const CategoryIcon = categoryMeta.icon

                    return {
                      key: task.id,
                      title: task.title,
                      subtitle: task.apartment_or_area || t('noLocation'),
                      meta: task.task_time
                        ? formatDashboardTaskTime(task.task_time, locale)
                        : formatDashboardTaskDate(task.task_date, locale, copy),
                      tone:
                        task.priority === 'high'
                          ? 'red'
                          : task.priority === 'medium'
                            ? 'amber'
                            : 'green',
                      icon: (
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${categoryMeta.iconWrap}`}
                        >
                          <CategoryIcon size={20} />
                        </span>
                      ),
                      task,
                    }
                  })}
                />

                <DashboardWideListCard
                  title={copy.activeProblems}
                  count={activeProblems.length}
                  actionLabel={copy.viewAll}
                  onAction={() => router.push(`/tasks?buildingId=${buildingId}`)}
                  expandedTaskId={expandedTaskId}
                  noLocationLabel={t('noLocation')}
                  priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                  onToggleTask={(task) =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onCompleteTask={(task) => void requestTaskCompletion(task)}
                  onSwipeCompleteTask={(task) => void requestTaskSwipeCompletion(task)}
                  onOpenTask={openEditModal}
                  onSetPendingTask={(task) => void updateTaskStatus(task.id, 'pending')}
                  onSetInProgressTask={(task) =>
                    void updateTaskStatus(task.id, 'in_progress')
                  }
                  onDeleteTask={queueDeleteTask}
                  emptyLabel={copy.noActiveProblems}
                  items={activeProblems.map((task) => {
                    const { categoryMeta } = getTaskCardViewModel(task)
                    const CategoryIcon = categoryMeta.icon

                    return {
                      key: task.id,
                      title: task.title,
                      subtitle: task.apartment_or_area || t('noLocation'),
                      meta: labelT(getPriorityKey(task.priority)),
                      tone: task.priority === 'high' ? 'red' : 'amber',
                      icon: (
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${categoryMeta.iconWrap}`}
                        >
                          <CategoryIcon size={20} />
                        </span>
                      ),
                      task,
                    }
                  })}
                />

                <DashboardWideListCard
                  title={copy.smartReminders}
                  actionLabel={copy.viewAll}
                  onAction={() => router.push(`/agenda?buildingId=${buildingId}`)}
                  expandedTaskId={expandedTaskId}
                  noLocationLabel={t('noLocation')}
                  priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                  onToggleTask={(task) =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onCompleteTask={(task) => void requestTaskCompletion(task)}
                  onSwipeCompleteTask={(task) => void requestTaskSwipeCompletion(task)}
                  onOpenTask={openEditModal}
                  onSetPendingTask={(task) => void updateTaskStatus(task.id, 'pending')}
                  onSetInProgressTask={(task) =>
                    void updateTaskStatus(task.id, 'in_progress')
                  }
                  onDeleteTask={queueDeleteTask}
                  emptyLabel={copy.noSmartReminders}
                  items={smartReminders.map((task) => ({
                    key: task.id,
                    title: task.title,
                    subtitle: task.apartment_or_area || t('noLocation'),
                    meta: formatDashboardTaskDate(task.task_date, locale, copy),
                    tone: 'green',
                    icon: (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF7F0] text-[#248A4E]">
                        <CalendarDays size={20} />
                      </span>
                    ),
                    task,
                  }))}
                />

                <DashboardWideListCard
                  title={copy.hotAreas}
                  actionLabel={copy.viewAll}
                  onAction={() => router.push(`/tasks?buildingId=${buildingId}`)}
                  emptyLabel={copy.noHotAreas}
                  locale={locale}
                  expandedItemKey={expandedHotAreaKey}
                  onToggleItem={(itemKey) =>
                    setExpandedHotAreaKey((prev) => (prev === itemKey ? null : itemKey))
                  }
                  expandedTaskId={expandedTaskId}
                  noLocationLabel={t('noLocation')}
                  priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                  onToggleTask={(task) =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onCompleteTask={(task) => void requestTaskCompletion(task)}
                  onSwipeCompleteTask={(task) => void requestTaskSwipeCompletion(task)}
                  onOpenTask={openEditModal}
                  onSetPendingTask={(task) => void updateTaskStatus(task.id, 'pending')}
                  onSetInProgressTask={(task) =>
                    void updateTaskStatus(task.id, 'in_progress')
                  }
                  onDeleteTask={queueDeleteTask}
                  items={hotAreas.map((area) => ({
                    key: area.name,
                    title: area.name,
                    subtitle: '',
                    meta:
                      area.count === 1
                        ? copy.singleHotAreaTask
                        : copy.hotAreaTasks.replace('{count}', String(area.count)),
                    tone: area.count >= 3 ? 'red' : area.count === 2 ? 'amber' : 'green',
                    icon: (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EEF4FF] text-[#4D66DA]">
                        <ListTodo size={20} />
                      </span>
                    ),
                    nestedTasks: area.tasks
                      .slice()
                      .sort((a, b) => getTaskDateTime(a) - getTaskDateTime(b))
                      .slice(0, 5),
                  }))}
                />

                <DashboardWideListCard
                  title={copy.quickHistory}
                  actionLabel={copy.viewAll}
                  onAction={() => router.push(`/tasks?buildingId=${buildingId}`)}
                  expandedTaskId={expandedTaskId}
                  noLocationLabel={t('noLocation')}
                  priorityLabel={(priority) => labelT(getPriorityKey(priority))}
                  onToggleTask={(task) =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onCompleteTask={(task) => void requestTaskCompletion(task)}
                  onSwipeCompleteTask={(task) => void requestTaskSwipeCompletion(task)}
                  onOpenTask={openEditModal}
                  onSetPendingTask={(task) => void updateTaskStatus(task.id, 'pending')}
                  onSetInProgressTask={(task) =>
                    void updateTaskStatus(task.id, 'in_progress')
                  }
                  onDeleteTask={queueDeleteTask}
                  emptyLabel={copy.noHistoryToday}
                  items={completedTodayTasks.map((task) => ({
                    key: task.id,
                    title: task.title,
                    subtitle: task.apartment_or_area || t('noLocation'),
                    meta: task.completed_at
                      ? `${copy.completedAtLabel} ${new Intl.DateTimeFormat(locale, {
                          hour: 'numeric',
                          minute: '2-digit',
                        }).format(new Date(task.completed_at))}`
                      : '',
                    tone: 'green',
                    icon: (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7F0] text-[#248A4E]">
                        <CheckCircle2 size={18} />
                      </span>
                    ),
                    task,
                  }))}
                />
              </div>
            )}
          </section>

          <BottomNav active="dashboard" buildingId={buildingId} />

          {!isConciergeHome ? (
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
        </div>
      </main>

      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          closeModal()
          setRequestTaskDraft(null)
          setRequestSourceId(null)
          setQuickPhotoFile(null)
        }}
        buildingId={buildingId}
        profileId={profileId}
        onCreated={async () => {
          if (requestSourceId) {
            await ownerRequests.markConverted(requestSourceId)
          }
          await fetchDashboardData()
          await ownerRequests.reloadRequests()
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
        open={messagesInboxOpen}
        conversations={recentConversations}
        onClose={() => setMessagesInboxOpen(false)}
        onSelect={(conversation) => {
          markRecentConversationRead(conversation)

          if (conversation.building_id === buildingId) {
            setMessagesInboxOpen(false)
            void openConversation()
            return
          }

          setMessagesInboxOpen(false)
          router.push(
            `/dashboard?buildingId=${conversation.building_id}&openMessages=1`
          )
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

      <TaskInventoryFlowModals taskInventory={taskInventory} />
      <input
  ref={quickPhotoInputRef}
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  onChange={handleQuickPhotoSelected}
/>
<TaskInventoryFlowModals taskInventory={taskInventory} />

{isListening && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white px-8 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
          <Mic size={28} />
        </span>
      </div>

      <p className="text-[16px] font-semibold text-[#142952]">
        Escuchando...
      </p>

      <p className="text-[13px] text-[#6E7F9D] text-center">
        Habla ahora, se detendrá automáticamente
      </p>
    </div>
  </div>
)}
    </>
  )
}

function DashboardSpotlightCard({
  task,
  label,
  reason,
  expanded,
  locale,
  copy,
  noLocationLabel,
  priorityLabel,
  onComplete,
  onSwipeComplete,
  onOpenTask,
  onSetPending,
  onSetInProgress,
  onDelete,
  onToggleExpand,
}: {
  task: EditableTask | null
  label: string
  reason: string | null
  expanded: boolean
  locale: string
  copy: DashboardCopy
  noLocationLabel: string
  priorityLabel: (priority: TaskPriority) => string
  onComplete: (task: EditableTask) => void
  onSwipeComplete?: (task: EditableTask) => void
  onOpenTask: (task: EditableTask) => void
  onSetPending: (task: EditableTask) => void
  onSetInProgress: (task: EditableTask) => void
  onDelete: (task: EditableTask) => void
  onToggleExpand: (task: EditableTask) => void
}) {
  const {
    rootRef,
    translateX,
    dragging,
    swipeState,
    touchMovedRef,
    closeSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTaskCardSwipe()

  if (!task) {
    return (
        <div className="rounded-[28px] border border-[#E7EDF5] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
          <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#8A92B2]">
            {label}
          </p>
          <p className="mt-4 text-[16px] font-semibold text-[#142952]">
            {copy.noTasks}
        </p>
      </div>
    )
  }

  const {
    apartmentSummary,
    hasPhotos,
    pestTargets,
    taskApartments,
    categoryMeta,
  } = getTaskCardViewModel(task)
  const CategoryIcon = categoryMeta.icon

  const handleCardClick = () => {
    if (touchMovedRef.current) return
    if (swipeState !== 'closed') {
      closeSwipe()
      return
    }
    onToggleExpand(task)
  }

  return (
    <div ref={rootRef} className="relative">
      <SwipeBackground
        translateX={translateX}
        completeLabel={copy.completeTask}
        onComplete={() => {
          ;(onSwipeComplete || onComplete)(task)
          closeSwipe()
        }}
        onDelete={() => {
          onDelete(task)
          closeSwipe()
        }}
      />

      <div
        className="relative overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 220ms ease',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={handleCardClick}
          className="block w-full px-4 py-4 text-left"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] ${categoryMeta.iconWrap}`}
            >
              <CategoryIcon size={28} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8A92B2]">
                {label}
              </p>
              {reason ? (
                <span className="mt-2 inline-flex rounded-full bg-[#F3F6FC] px-3 py-1 text-[12px] font-semibold text-[#6B7A9A]">
                  {reason}
                </span>
              ) : null}
              <h2 className="mt-1 text-[20px] font-bold leading-tight text-[#142952]">
                {task.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-[#4E5C7A]">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-[#8A97B3]" />
                  {task.apartment_or_area || noLocationLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${getPriorityDot(task.priority)}`}
                  />
                  {priorityLabel(task.priority)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} className="text-[#8A97B3]" />
                  {formatDashboardTaskDate(task.task_date, locale, copy)}
                </span>
                {task.task_time ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} className="text-[#8A97B3]" />
                    {formatDashboardTaskTime(task.task_time, locale)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </button>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onComplete(task)
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-[#4B63DF] px-4 py-3.5 text-[16px] font-semibold text-white shadow-[0_14px_28px_rgba(75,99,223,0.24)]"
          >
            <CheckCircle2 size={20} />
            {copy.completeTask}
          </button>
        </div>

        <ExpandableTaskDetails
          expanded={expanded}
          task={task}
          apartmentSummary={apartmentSummary}
          hasPhotos={hasPhotos}
          pestTargets={pestTargets}
          taskApartments={taskApartments}
          onSetPending={() => onSetPending(task)}
          onSetInProgress={() => onSetInProgress(task)}
          onComplete={() => onComplete(task)}
          onEdit={() => onOpenTask(task)}
          onDelete={() => onDelete(task)}
        />
      </div>
    </div>
  )
}

type DashboardQuickAction = {
  key: string
  label: string
  icon: React.ReactNode
  tone: 'blue' | 'violet' | 'indigo' | 'green'
  onClick: () => void
}

function DashboardQuickActions({
  title,
  actions,
}: {
  title: string
  actions: DashboardQuickAction[]
}) {
  return (
    <section>
      {/* Título */}
      <div className="mb-3 px-1">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#5E6A8E]">
          {title}
        </h2>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-4 gap-2.5">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[20px] border border-[#E7EDF5] bg-white px-2 py-3 text-center shadow-[0_10px_24px_rgba(20,41,82,0.06)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(20,41,82,0.08)] active:scale-[0.96]"
          >
            {/* Icono */}
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${getQuickActionTone(
                action.tone
              )}`}
            >
              {action.icon}
            </span>

            {/* Texto */}
            <span className="whitespace-pre-line text-[12px] font-semibold leading-[1.15] text-[#142952]">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
function DashboardWideListCard({
  title,
  count,
  actionLabel,
  onAction,
  emptyLabel,
  locale = 'es',
  expandedItemKey,
  onToggleItem,
  expandedTaskId,
  noLocationLabel,
  priorityLabel,
  onToggleTask,
  onCompleteTask,
  onSwipeCompleteTask,
  onOpenTask,
  onSetPendingTask,
  onSetInProgressTask,
  onDeleteTask,
  items,
}: {
  title: string
  count?: number
  actionLabel: string
  onAction: () => void
  emptyLabel: string
  locale?: string
  expandedItemKey?: string | null
  onToggleItem?: (itemKey: string) => void
  expandedTaskId?: string | null
  noLocationLabel?: string
  priorityLabel?: (priority: TaskPriority) => string
  onToggleTask?: (task: EditableTask) => void
  onCompleteTask?: (task: EditableTask) => void
  onSwipeCompleteTask?: (task: EditableTask) => void
  onOpenTask?: (task: EditableTask) => void
  onSetPendingTask?: (task: EditableTask) => void
  onSetInProgressTask?: (task: EditableTask) => void
  onDeleteTask?: (task: EditableTask) => void
  items: Array<{
    key: string
    title: string
    subtitle: string
    meta: string
    tone: 'red' | 'amber' | 'green'
    icon: React.ReactNode
    task?: EditableTask
    nestedTasks?: EditableTask[]
  }>
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#7B86A8]">
            {title}
          </h2>
          {typeof count === 'number' ? (
            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-[#FFF4F5] px-2 py-0.5 text-[12px] font-semibold text-[#D64555]">
              {count}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onAction}
          className="text-[14px] font-semibold text-[#4D66DA]"
        >
          {actionLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 pb-5 text-sm text-[#7B86A8]">{emptyLabel}</div>
      ) : (
        <div className="px-4 pb-4">
          {items.map((item, index) => (
            <div
              key={item.key}
              className={index < items.length - 1 ? 'border-b border-[#EEF2F8]' : ''}
            >
              {item.task && onToggleTask && onCompleteTask ? (
                <DashboardSwipeTaskRow
                  title={item.title}
                  subtitle={item.subtitle}
                  meta={item.meta}
                  tone={item.tone}
                  icon={item.icon}
                  completeLabel="Completar"
                  onClick={() => onToggleTask(item.task!)}
                  onComplete={() => onCompleteTask(item.task!)}
                  onSwipeComplete={
                    onSwipeCompleteTask
                      ? () => onSwipeCompleteTask(item.task!)
                      : undefined
                  }
                  onDelete={onDeleteTask ? () => onDeleteTask(item.task!) : undefined}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (item.nestedTasks?.length && onToggleItem) {
                      onToggleItem(item.key)
                    }
                  }}
                  className="flex w-full items-start gap-3 py-3 text-left"
                >
                  {item.icon}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[18px] font-semibold text-[#142952]">
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className="mt-0.5 text-[14px] text-[#6E7F9D]">
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 text-[14px] font-semibold ${getInfoToneText(item.tone)}`}
                  >
                    {item.meta}
                  </span>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-[#8A97B3]" />
                </button>
              )}

              {item.nestedTasks?.length &&
              expandedItemKey === item.key &&
              noLocationLabel &&
              priorityLabel &&
              onToggleTask &&
              onCompleteTask &&
              onOpenTask &&
              onSetPendingTask &&
              onSetInProgressTask &&
              onDeleteTask ? (
                <div className="space-y-1 border-t border-[#EEF2F8] pb-2 pt-2">
                  {item.nestedTasks.map((task) => {
                    const { categoryMeta } = getTaskCardViewModel(task)
                    const CategoryIcon = categoryMeta.icon

                    return (
                      <div
                        key={task.id}
                        className="overflow-hidden rounded-[18px] bg-[#F8FAFE]"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleTask(task)}
                          className="flex w-full items-start gap-3 px-3 py-3 text-left"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${categoryMeta.iconWrap}`}
                          >
                            <CategoryIcon size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-[#142952]">
                              {task.title}
                            </p>
                            <p className="mt-0.5 text-[13px] text-[#6E7F9D]">
                              {task.apartment_or_area || noLocationLabel} •{' '}
                              {priorityLabel(task.priority)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[13px] font-semibold ${getInfoToneText(
                              task.priority === 'high'
                                ? 'red'
                                : task.priority === 'medium'
                                  ? 'amber'
                                  : 'green'
                            )}`}
                          >
                            {task.task_time
                              ? formatDashboardTaskTime(task.task_time, locale)
                              : formatTaskDate(task.task_date, locale)}
                          </span>
                          <ChevronRight
                            size={16}
                            className="mt-0.5 shrink-0 text-[#8A97B3]"
                          />
                        </button>

                        {expandedTaskId === task.id ? (
                          <ExpandableTaskDetails
                            expanded
                            task={task}
                            apartmentSummary={getTaskCardViewModel(task).apartmentSummary}
                            hasPhotos={getTaskCardViewModel(task).hasPhotos}
                            pestTargets={getTaskCardViewModel(task).pestTargets}
                            taskApartments={getTaskCardViewModel(task).taskApartments}
                            onSetPending={() => onSetPendingTask(task)}
                            onSetInProgress={() => onSetInProgressTask(task)}
                            onComplete={() => onCompleteTask(task)}
                            onEdit={() => onOpenTask(task)}
                            onDelete={() => onDeleteTask(task)}
                            withTopBorder
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {item.task &&
              expandedTaskId === item.task.id &&
              noLocationLabel &&
              priorityLabel &&
              onCompleteTask &&
              onOpenTask &&
              onSetPendingTask &&
              onSetInProgressTask &&
              onDeleteTask ? (
                <ExpandableTaskDetails
                  expanded
                  task={item.task}
                  apartmentSummary={getTaskCardViewModel(item.task).apartmentSummary}
                  hasPhotos={getTaskCardViewModel(item.task).hasPhotos}
                  pestTargets={getTaskCardViewModel(item.task).pestTargets}
                  taskApartments={getTaskCardViewModel(item.task).taskApartments}
                  onSetPending={() => onSetPendingTask(item.task!)}
                  onSetInProgress={() => onSetInProgressTask(item.task!)}
                  onComplete={() => onCompleteTask(item.task!)}
                  onEdit={() => onOpenTask(item.task!)}
                  onDelete={() => onDeleteTask(item.task!)}
                  withTopBorder
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DashboardSwipeTaskRow({
  title,
  subtitle,
  meta,
  tone,
  icon,
  completeLabel,
  compact = false,
  onClick,
  onComplete,
  onSwipeComplete,
  onDelete,
}: {
  title: string
  subtitle: string
  meta: string
  tone: 'red' | 'amber' | 'green'
  icon: React.ReactNode
  completeLabel: string
  compact?: boolean
  onClick: () => void
  onComplete: () => void
  onSwipeComplete?: () => void
  onDelete?: () => void
}) {
  const {
    rootRef,
    translateX,
    dragging,
    swipeState,
    touchMovedRef,
    closeSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTaskCardSwipe()

  const handleRowClick = () => {
    if (touchMovedRef.current) return
    if (swipeState !== 'closed') {
      closeSwipe()
      return
    }
    onClick()
  }

  return (
    <div ref={rootRef} className="relative">
      <SwipeBackground
        translateX={translateX}
        completeLabel={completeLabel}
        compact={compact}
        onComplete={() => {
          ;(onSwipeComplete || onComplete)()
          closeSwipe()
        }}
        onDelete={() => {
          onDelete?.()
          closeSwipe()
        }}
      />

      <div
        className={`relative overflow-hidden bg-white ${
          compact ? 'rounded-[18px]' : 'rounded-[24px]'
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 220ms ease',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={handleRowClick}
          className={`flex w-full items-start gap-3 text-left ${compact ? 'px-3 py-3' : 'py-3'}`}
        >
          {icon}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-semibold text-[#142952] ${
                compact ? 'text-[15px]' : 'text-[18px]'
              }`}
            >
              {title}
            </p>
            {subtitle ? (
              <p
                className={`mt-0.5 text-[#6E7F9D] ${
                  compact ? 'text-[13px]' : 'text-[14px]'
                }`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          <span
            className={`shrink-0 font-semibold ${getInfoToneText(tone)} ${
              compact ? 'text-[13px]' : 'text-[14px]'
            }`}
          >
            {meta}
          </span>
          <ChevronRight
            size={compact ? 16 : 18}
            className="mt-0.5 shrink-0 text-[#8A97B3]"
          />
        </button>
      </div>
    </div>
  )
}

function ExpandableTaskDetails({
  expanded,
  task,
  apartmentSummary,
  hasPhotos,
  pestTargets,
  taskApartments,
  onSetPending,
  onSetInProgress,
  onComplete,
  onEdit,
  onDelete,
  withTopBorder = false,
}: {
  expanded: boolean
  task: EditableTask
  apartmentSummary: string | null
  hasPhotos: boolean
  pestTargets: EditableTask['pest_targets']
  taskApartments: EditableTask['task_apartments']
  onSetPending: () => void
  onSetInProgress: () => void
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
  withTopBorder?: boolean
}) {
  return (
    <div
      className={`grid transition-all duration-300 ${
        expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className={withTopBorder ? 'border-t border-[#EEF2F8]' : ''}>
          <TaskCardExpandedContent
            task={task}
            apartmentSummary={apartmentSummary}
            hasPhotos={hasPhotos}
            pestTargets={pestTargets || []}
            taskApartments={taskApartments || []}
            onSetPending={onSetPending}
            onSetInProgress={onSetInProgress}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}

function SwipeBackground({
  translateX,
  completeLabel,
  compact = false,
  onComplete,
  onDelete,
}: {
  translateX: number
  completeLabel: string
  compact?: boolean
  onComplete: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${
        compact ? 'rounded-[18px]' : 'rounded-[24px]'
      }`}
    >
      <div
        className="absolute inset-0 transition-colors duration-200"
        style={{
          background:
            translateX > 0
              ? `rgba(121,196,124, ${Math.min(translateX / 120, 1)})`
              : translateX < 0
                ? `rgba(230,91,103, ${Math.min(Math.abs(translateX) / 120, 1)})`
                : 'transparent',
        }}
      />

      <div className="absolute inset-y-0 left-0 flex items-stretch">
        <button
          type="button"
          onClick={onComplete}
          className="flex w-[96px] items-center justify-center gap-2 text-white"
        >
          <Check className="h-5 w-5" />
          <span className="text-sm font-semibold">{completeLabel}</span>
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          type="button"
          onClick={onDelete}
          className="flex w-[96px] items-center justify-center gap-2 text-white"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-sm font-semibold">Eliminar</span>
        </button>
      </div>
    </div>
  )
}

type DashboardCopy = {
  subtitle: string
  spotlight: string
  spotlightToday: string
  spotlightNext: string
  spotlightOverdue: string
  spotlightUrgentToday: string
  spotlightUrgentOverdue: string
  spotlightUrgentNext: string
  completeTask: string
  alerts: string
  overdueTasks: string
  urgentTasks: string
  todayTasks: string
  upcomingTasks: string
  quickActions: string
  quickActionNewTask: string
  quickActionTasks: string
  quickActionInventory: string
  quickActionAgenda: string
  activeProblems: string
  noActiveProblems: string
  smartReminders: string
  noSmartReminders: string
  hotAreas: string
  noHotAreas: string
  singleHotAreaTask: string
  hotAreaTasks: string
  quickHistory: string
  noHistoryToday: string
  completedAtLabel: string
  viewAll: string
  noTasks: string
  noTodayTasks: string
  noUpcomingTasks: string
  noOverdueTasks: string
  noUrgentTasks: string
  todayWord: string
  tomorrowWord: string
}

function getConciergeDashboardCopy(locale: string): DashboardCopy {
  if (locale.startsWith('fr')) {
    return {
      subtitle: 'On va passer une belle journee',
      spotlight: 'Le plus important maintenant',
      spotlightToday: "Aujourd'hui",
      spotlightNext: 'Prochaine tache',
      spotlightOverdue: 'En retard',
      spotlightUrgentToday: "Urgente aujourd'hui",
      spotlightUrgentOverdue: 'Urgente et en retard',
      spotlightUrgentNext: 'Prochaine urgente',
      completeTask: 'Terminer la tache',
      alerts: 'Alertes',
      overdueTasks: 'Taches en retard',
      urgentTasks: 'Taches urgentes',
      todayTasks: "Taches d'aujourd'hui",
      upcomingTasks: 'Prochaines taches',
      quickActions: 'Raccourcis',
      quickActionNewTask: 'Nouvelle tache',
      quickActionTasks: 'Voir taches',
      quickActionInventory: 'Inventaire',
      quickActionAgenda: 'Voir agenda',
      activeProblems: 'Problemes actifs',
      noActiveProblems: 'Aucun probleme actif.',
      smartReminders: 'Rappels intelligents',
      noSmartReminders: 'Aucun rappel pour le moment.',
      hotAreas: 'Zones chaudes',
      noHotAreas: 'Aucune zone a surveiller.',
      singleHotAreaTask: '1 tache',
      hotAreaTasks: '{count} taches',
      quickHistory: 'Historique du jour',
      noHistoryToday: "Aucune tache completee aujourd'hui.",
      completedAtLabel: 'Completee',
      viewAll: 'Voir tout',
      noTasks: 'Aucune tache pour le moment.',
      noTodayTasks: "Aucune tache pour aujourd'hui.",
      noUpcomingTasks: 'Aucune tache a venir.',
      noOverdueTasks: 'Aucune tache en retard.',
      noUrgentTasks: 'Aucune tache urgente.',
      todayWord: "Aujourd'hui",
      tomorrowWord: 'Demain',
    }
  }

  if (locale.startsWith('ru')) {
    return {
      subtitle: 'Segodnya budet otlichnyy den',
      spotlight: 'Samoye vazhnoye seychas',
      spotlightToday: 'Na segodnya',
      spotlightNext: 'Sleduyushchaya zadacha',
      spotlightOverdue: 'Prosrochena',
      spotlightUrgentToday: 'Srochnaya segodnya',
      spotlightUrgentOverdue: 'Srochnaya i prosrochena',
      spotlightUrgentNext: 'Sleduyushchaya srochnaya',
      completeTask: 'Zavershit zadachu',
      alerts: 'Preduprezhdeniya',
      overdueTasks: 'Prosrochennye zadachi',
      urgentTasks: 'Srochnye zadachi',
      todayTasks: 'Zadachi na segodnya',
      upcomingTasks: 'Sleduyushchie zadachi',
      quickActions: 'Bystrye deystviya',
      quickActionNewTask: 'Novaya zadacha',
      quickActionTasks: 'Vse zadachi',
      quickActionInventory: 'Inventar',
      quickActionAgenda: 'Otkryt kalendar',
      activeProblems: 'Aktivnye problemy',
      noActiveProblems: 'Net aktivnykh problem.',
      smartReminders: 'Umnye napominaniya',
      noSmartReminders: 'Napominaniy poka net.',
      hotAreas: 'Goryachie zony',
      noHotAreas: 'Net zon dlya kontrolya.',
      singleHotAreaTask: '1 zadacha',
      hotAreaTasks: '{count} zadachi',
      quickHistory: 'Istoriya za den',
      noHistoryToday: 'Segodnya net zavershennykh zadach.',
      completedAtLabel: 'Zavershena',
      viewAll: 'Smotret vse',
      noTasks: 'Poka net zadach.',
      noTodayTasks: 'Na segodnya zadach net.',
      noUpcomingTasks: 'Net predstoyashchikh zadach.',
      noOverdueTasks: 'Net prosrochennykh zadach.',
      noUrgentTasks: 'Net srochnykh zadach.',
      todayWord: 'Segodnya',
      tomorrowWord: 'Zavtra',
    }
  }

  if (locale.startsWith('en')) {
    return {
      subtitle: 'We are going to have a great day',
      spotlight: 'Most important now',
      spotlightToday: 'Today',
      spotlightNext: 'Next task',
      spotlightOverdue: 'Overdue',
      spotlightUrgentToday: 'Urgent today',
      spotlightUrgentOverdue: 'Urgent and overdue',
      spotlightUrgentNext: 'Next urgent',
      completeTask: 'Complete task',
      alerts: 'Alerts',
      overdueTasks: 'Overdue tasks',
      urgentTasks: 'Urgent tasks',
      todayTasks: 'Today tasks',
      upcomingTasks: 'Upcoming tasks',
      quickActions: 'Quick actions',
      quickActionNewTask: 'New task',
      quickActionTasks: 'View tasks',
      quickActionInventory: 'Inventory',
      quickActionAgenda: 'Open agenda',
      activeProblems: 'Active problems',
      noActiveProblems: 'No active problems.',
      smartReminders: 'Smart reminders',
      noSmartReminders: 'No reminders for now.',
      hotAreas: 'Hot areas',
      noHotAreas: 'No hot areas right now.',
      singleHotAreaTask: '1 task',
      hotAreaTasks: '{count} tasks',
      quickHistory: 'Today history',
      noHistoryToday: 'No completed tasks today.',
      completedAtLabel: 'Completed',
      viewAll: 'View all',
      noTasks: 'No tasks for now.',
      noTodayTasks: 'No tasks for today.',
      noUpcomingTasks: 'No upcoming tasks.',
      noOverdueTasks: 'No overdue tasks.',
      noUrgentTasks: 'No urgent tasks.',
      todayWord: 'Today',
      tomorrowWord: 'Tomorrow',
    }
  }

  return {
    subtitle: 'Vamos a tener un gran dia',
    spotlight: 'Lo mas importante ahora',
    spotlightToday: 'De hoy',
    spotlightNext: 'Proxima tarea',
    spotlightOverdue: 'Atrasada',
    spotlightUrgentToday: 'Urgente hoy',
    spotlightUrgentOverdue: 'Urgente y atrasada',
    spotlightUrgentNext: 'Proxima urgente',
    completeTask: 'Completar tarea',
    alerts: 'Alertas',
    overdueTasks: 'Tareas atrasadas',
    urgentTasks: 'Tareas urgentes',
    todayTasks: 'Tareas de hoy',
    upcomingTasks: 'Proximas tareas',
    quickActions: 'Atajos rapidos',
    quickActionNewTask: 'Nueva tarea',
    quickActionTasks: 'Ver tareas',
    quickActionInventory: 'Inventario',
    quickActionAgenda: 'Ver agenda',
    activeProblems: 'Problemas activos',
    noActiveProblems: 'No hay problemas activos.',
    smartReminders: 'Recordatorios inteligentes',
    noSmartReminders: 'No hay recordatorios por ahora.',
    hotAreas: 'Areas calientes',
    noHotAreas: 'No hay areas para vigilar ahora.',
    singleHotAreaTask: '1 tarea',
    hotAreaTasks: '{count} tareas',
    quickHistory: 'Historial rapido del dia',
    noHistoryToday: 'No hay tareas completadas hoy.',
    completedAtLabel: 'Completada',
    viewAll: 'Ver todas',
    noTasks: 'No hay tareas por ahora.',
    noTodayTasks: 'No hay tareas para hoy.',
    noUpcomingTasks: 'No hay proximas tareas.',
    noOverdueTasks: 'No hay tareas atrasadas.',
    noUrgentTasks: 'No hay tareas urgentes.',
    todayWord: 'Hoy',
    tomorrowWord: 'Manana',
  }
}

function formatDashboardTaskTime(taskTime: string, locale: string) {
  const [hours = '0', minutes = '0'] = taskTime.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDashboardTaskDate(
  taskDate: string,
  locale: string,
  copy: DashboardCopy
) {
  const today = new Date().toLocaleDateString('en-CA')
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = tomorrowDate.toLocaleDateString('en-CA')
  const current = new Date(`${taskDate}T12:00:00`).toLocaleDateString('en-CA')

  if (current === today) {
    return `${copy.todayWord}, ${formatTaskDate(taskDate, locale)}`
  }

  if (current === tomorrow) {
    return `${copy.tomorrowWord}, ${formatTaskDate(taskDate, locale)}`
  }

  return formatTaskDate(taskDate, locale)
}

function getPriorityDot(priority: TaskPriority) {
  if (priority === 'high') return 'bg-[#F25C54]'
  if (priority === 'medium') return 'bg-[#F6A623]'
  return 'bg-[#2BAA60]'
}

function getQuickActionTone(tone: DashboardQuickAction['tone']) {
  if (tone === 'blue') return 'bg-[#EEF4FF] text-[#4D66DA]'
  if (tone === 'violet') return 'bg-[#F3EEFF] text-[#7A5AC7]'
  if (tone === 'green') return 'bg-[#EAF7F0] text-[#248A4E]'
  return 'bg-[#EEF4FF] text-[#2F66C8]'
}

function getInfoToneText(tone: 'red' | 'amber' | 'green') {
  if (tone === 'red') return 'text-[#D64555]'
  if (tone === 'amber') return 'text-[#D9811E]'
  return 'text-[#248A4E]'
}
