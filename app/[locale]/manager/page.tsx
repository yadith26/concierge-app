'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarPlus2,
  ChevronRight,
  ClipboardList,
  MessageSquareMore,
  Plus,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  fetchBuildingsForUser,
  type BuildingSummary,
} from '@/lib/buildings/buildingMembershipService'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerRootBottomNav from '@/components/layout/ManagerRootBottomNav'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import ManagerHomeBuildingCard from '@/components/manager/ManagerHomeBuildingCard'
import ManagerHomeTaskSummary, {
  type ManagerHomeTaskFilter,
} from '@/components/manager/ManagerHomeTaskSummary'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import ManagerAgendaEventModal from '@/components/manager/ManagerAgendaEventModal'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import { getLocalDateInputValue } from '@/lib/dates/localDate'
import {
  buildManagerTaskCountsByBuilding,
  buildManagerTaskSummary,
  deleteManagerTask,
  fetchConciergeTodayTaskCountsByBuilding,
  fetchManagerTasksForManager,
  updateManagerTaskStatus,
  type ManagerTask,
} from '@/lib/manager/managerTaskService'
import { parseSmartTaskInput } from '@/lib/tasks/taskSmartParser'
import type { TaskCategory, TaskDraft, TaskStatus } from '@/lib/tasks/taskTypes'

type ManagerBuilding = BuildingSummary

export default function ManagerPage() {
  const router = useRouter()
  const locale = useLocale()
  const headerConversation = useHeaderConversation()
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const todayInput = getLocalDateInputValue()

  const [buildings, setBuildings] = useState<ManagerBuilding[]>([])
  const [managerTasks, setManagerTasks] = useState<ManagerTask[]>([])
  const [conciergeTaskCounts, setConciergeTaskCounts] = useState<
    Record<string, number>
  >({})
  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)
  const [selectedTaskToEdit, setSelectedTaskToEdit] =
    useState<ManagerTask | null>(null)
  const [profileId, setProfileId] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(todayInput)
  const [eventBuildingId, setEventBuildingId] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventCategory, setEventCategory] = useState<TaskCategory | ''>('')
  const [eventNotes, setEventNotes] = useState('')
  const [eventCategoryEditedManually, setEventCategoryEditedManually] =
    useState(false)
  const [eventLocationEditedManually, setEventLocationEditedManually] =
    useState(false)
  const [activeTaskSummaryFilter, setActiveTaskSummaryFilter] =
    useState<ManagerHomeTaskFilter>('today')
  const [taskGroupOpen, setTaskGroupOpen] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [undoDelete, setUndoDelete] = useState<{
    task: ManagerTask
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  const greetingName = userName.trim().split(' ')[0] || 'Manager'
  const managerTaskSummary = useMemo(
    () => buildManagerTaskSummary(managerTasks),
    [managerTasks]
  )
  const managerTaskCountsByBuilding = useMemo(
    () => buildManagerTaskCountsByBuilding(managerTasks),
    [managerTasks]
  )
  const buildingNameById = useMemo(
    () =>
      buildings.reduce<Record<string, string>>((map, building) => {
        map[building.id] = building.name
        return map
      }, {}),
    [buildings]
  )

  const refreshManagerTasks = useCallback(async (managerId: string) => {
    const nextTasks = await fetchManagerTasksForManager(managerId)
    setManagerTasks(nextTasks)
  }, [])

  useEffect(() => {
    return () => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
      }
    }
  }, [undoDelete])

  const handleTaskStatusChange = useCallback(
    async (task: ManagerTask, status: TaskStatus) => {
      const managerId = profileId || headerConversation.currentUserId
      if (!managerId) return

      const previousTasks = managerTasks
      setManagerTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status,
                completed_at:
                  status === 'completed' ? new Date().toISOString() : null,
              }
            : item
        )
      )

      try {
        await updateManagerTaskStatus({
          taskId: task.id,
          managerId,
          status,
        })
      } catch (error) {
        setManagerTasks(previousTasks)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar la tarea.'
        )
      }
    },
    [headerConversation.currentUserId, managerTasks, profileId]
  )

  const finalizeDeleteTask = useCallback(
    async (taskId: string) => {
      const managerId = profileId || headerConversation.currentUserId
      if (!managerId) return

      try {
        await deleteManagerTask({ taskId, managerId })
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo borrar la tarea.'
        )
        await refreshManagerTasks(managerId)
      }
    },
    [headerConversation.currentUserId, profileId, refreshManagerTasks]
  )

  const queueDeleteTask = useCallback(
    (task: ManagerTask) => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
        void finalizeDeleteTask(undoDelete.task.id)
      }

      setManagerTasks((current) => current.filter((item) => item.id !== task.id))
      setExpandedTaskId((current) => (current === task.id ? null : current))

      const timeoutId = setTimeout(() => {
        void finalizeDeleteTask(task.id)
        setUndoDelete(null)
      }, 5000)

      setUndoDelete({ task, timeoutId })
    },
    [finalizeDeleteTask, undoDelete]
  )

  const undoDeleteTask = useCallback(() => {
    if (!undoDelete) return

    clearTimeout(undoDelete.timeoutId)
    setManagerTasks((current) => [...current, undoDelete.task])
    setUndoDelete(null)
  }, [undoDelete])

  const openCreateManagerTask = useCallback(() => {
    setCreateMenuOpen(false)
    setSelectedTaskToEdit(null)
    setMessageTaskDraft(null)
    setMessageTaskSourceId(null)
    setMessageTaskModalOpen(true)
  }, [])

  const openCreateConciergeEvent = useCallback(() => {
    setCreateMenuOpen(false)
    setEventTitle('')
    setEventDate(todayInput)
    setEventBuildingId(buildings.length === 1 ? buildings[0].id : '')
    setEventLocation('')
    setEventCategory('')
    setEventNotes('')
    setEventCategoryEditedManually(false)
    setEventLocationEditedManually(false)
    setFeedbackMessage('')
    setEventModalOpen(true)
  }, [buildings, todayInput])

  const handleEventTitleChange = useCallback(
    (value: string) => {
      setEventTitle(value)
      const parsed = parseSmartTaskInput(value, locale)

      if (!eventCategoryEditedManually) {
        setEventCategory(parsed.detectedCategory || '')
      }

      if (!eventLocationEditedManually) {
        setEventLocation(parsed.detectedLocation || '')
      }
    },
    [eventCategoryEditedManually, eventLocationEditedManually, locale]
  )

  const handleCreateConciergeEvent = useCallback(async () => {
    const managerId = profileId || headerConversation.currentUserId

    if (!managerId) return

    if (!eventTitle.trim() || !eventDate) {
      setFeedbackMessage('Completa al menos titulo y fecha del evento.')
      return
    }

    if (!eventBuildingId) {
      setFeedbackMessage('Selecciona el edificio para enviar el evento.')
      return
    }

    if (eventDate < todayInput) {
      setFeedbackMessage('La fecha del evento no puede ser anterior a hoy.')
      return
    }

    setSavingEvent(true)
    setFeedbackMessage('')

    const { error } = await supabase.from('owner_requests').insert({
      building_id: eventBuildingId,
      created_by: managerId,
      title: eventTitle.trim(),
      description: eventNotes.trim() || null,
      suggested_date: eventDate,
      apartment_or_area: eventLocation.trim() || null,
      category_suggestion: eventCategory || null,
      status: 'pending',
    })

    setSavingEvent(false)

    if (error) {
      setFeedbackMessage(error.message || 'No se pudo crear el evento.')
      return
    }

    setEventModalOpen(false)
    setFeedbackMessage('Evento creado y enviado al conserje.')
  }, [
    eventBuildingId,
    eventCategory,
    eventDate,
    eventLocation,
    eventNotes,
    eventTitle,
    headerConversation.currentUserId,
    profileId,
    todayInput,
  ])

  useEffect(() => {
    const fetchManagerHome = async () => {
      setLoading(true)
      setErrorMessage('')

      const {
        data: { user },
        error: userError,
      } = await getSafeAuthUser()

      if (userError || !user) {
        router.replace('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setErrorMessage('No se pudo cargar tu perfil.')
        setLoading(false)
        return
      }

      if (profile.role !== 'manager') {
        router.replace('/dashboard')
        return
      }

      setProfileId(profile.id)
      setUserName(
        [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      )

      try {
        const nextBuildings = await fetchBuildingsForUser({
          userId: profile.id,
          role: 'manager',
        })
        const [
          nextManagerTasks,
          nextConciergeCounts,
        ] = await Promise.all([
          fetchManagerTasksForManager(profile.id),
          fetchConciergeTodayTaskCountsByBuilding(
            nextBuildings.map((building) => building.id)
          ),
        ])

        setBuildings(nextBuildings)
        setManagerTasks(nextManagerTasks)
        setConciergeTaskCounts(nextConciergeCounts)
      } catch {
        setErrorMessage('No se pudo cargar el inicio.')
        setLoading(false)
        return
      }

      setLoading(false)
    }

    void fetchManagerHome()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">Cargando inicio...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <ManagerHeader
            compact={compactHeader}
            title={`Hola, ${greetingName}`}
            showLogo
            showDate
            flatBottom
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 19 : 24} />,
                    label: 'Abrir mensajes',
                    count: headerConversation.unreadCount,
                    onClick: () => {
                      void headerConversation.openInbox()
                    },
                  }
                : null
            }
            headerContent={
              <div className="relative mt-12">
                <button
                  type="button"
                  onClick={() => setCreateMenuOpen((current) => !current)}
                  className="flex w-full items-center justify-center gap-3 rounded-[30px] bg-[#2F66C8] px-5 py-4 text-[18px] font-semibold text-white shadow-[0_16px_30px_rgba(47,102,200,0.28)] transition hover:bg-[#2859B2]"
                >
                  <Plus size={26} />
                  Crear
                </button>

                {createMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-[26px] border border-[#E3EAF3] bg-white shadow-[0_18px_40px_rgba(20,41,82,0.16)]">
                    <button
                      type="button"
                      onClick={openCreateManagerTask}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#F6F8FC]"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2F66C8]">
                        <ClipboardList size={21} />
                      </span>
                      <span>
                        <span className="block text-[15px] font-bold text-[#142952]">
                          Tarea administrativa
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-[#6E7F9D]">
                          Para tu agenda y seguimiento interno
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={openCreateConciergeEvent}
                      className="flex w-full items-center gap-3 border-t border-[#EEF2F7] px-5 py-4 text-left transition hover:bg-[#F6F8FC]"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFFAF4] text-[#2F855A]">
                        <CalendarPlus2 size={21} />
                      </span>
                      <span>
                        <span className="block text-[15px] font-bold text-[#142952]">
                          Evento para conserje
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-[#6E7F9D]">
                          Enviarlo a un edificio especifico
                        </span>
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            }
          />

          <section
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-5 pb-36 pt-6"
          >
            {errorMessage ? (
              <div className="mb-4 rounded-3xl border border-[#F1D3D3] bg-[#FFF5F5] px-5 py-4 text-sm font-medium text-[#C53030]">
                {errorMessage}
              </div>
            ) : null}

            {feedbackMessage ? (
              <div className="mb-4 rounded-3xl border border-[#DCE7F5] bg-white px-5 py-4 text-sm font-medium text-[#2F66C8]">
                {feedbackMessage}
              </div>
            ) : null}

            <div className="space-y-8">
              {!errorMessage ? (
                <ManagerHomeTaskSummary
                  activeFilter={activeTaskSummaryFilter}
                  buildingNameById={buildingNameById}
                  expandedTaskId={expandedTaskId}
                  groupOpen={taskGroupOpen}
                  summary={managerTaskSummary}
                  onDeleteTask={queueDeleteTask}
                  onEditTask={(task) => {
                    setSelectedTaskToEdit(task)
                    setMessageTaskDraft(null)
                    setMessageTaskSourceId(null)
                    setMessageTaskModalOpen(true)
                  }}
                  onFilterChange={(filter) => {
                    setActiveTaskSummaryFilter(filter)
                    setExpandedTaskId(null)
                    setTaskGroupOpen((current) =>
                      activeTaskSummaryFilter === filter ? !current : true
                    )
                  }}
                  onOpenTasks={() => router.push('/manager/tasks')}
                  onTaskStatusChange={(task, status) => {
                    void handleTaskStatusChange(task, status)
                  }}
                  onToggleGroup={() => {
                    setTaskGroupOpen((current) => !current)
                    setExpandedTaskId(null)
                  }}
                  onToggleTask={(taskId) =>
                    setExpandedTaskId((current) =>
                      current === taskId ? null : taskId
                    )
                  }
                />
              ) : null}

              {!errorMessage ? (
                <section className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-[24px] font-bold tracking-tight text-[#142952]">
                        Mis edificios
                      </h2>
                      <p className="mt-2 text-[15px] leading-6 text-[#6E7F9D]">
                        Tareas del conserje y tuyas por edificio
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push('/manager/buildings')}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#2F66C8]"
                    >
                      Administrar
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {buildings.length > 0 ? (
                    buildings.map((building) => (
                      <ManagerHomeBuildingCard
                        key={building.id}
                        building={building}
                        conciergeTodayTasks={conciergeTaskCounts[building.id] || 0}
                        managerOpenTasks={managerTaskCountsByBuilding[building.id] || 0}
                        onOpen={() => router.push(`/manager/buildings/${building.id}`)}
                      />
                    ))
                  ) : (
                    <div className="rounded-[26px] border border-[#E3EAF3] bg-white p-5 text-sm leading-6 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
                      Todavia no tienes edificios vinculados. Ve a Edificios para crear o conectar uno.
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          </section>

          <ManagerRootBottomNav active="home" />

          {undoDelete ? (
            <UndoDeleteToast
              taskTitle={undoDelete.task.title}
              onUndo={undoDeleteTask}
            />
          ) : null}
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title="Mensajes"
        subtitle={headerConversation.contactName || 'Sin contacto asignado'}
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
          setSelectedTaskToEdit(null)
          setMessageTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setMessageTaskSourceId(message.id)
          headerConversation.closeConversation()
          setMessageTaskModalOpen(true)
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

      <ManagerTaskFormModal
        open={messageTaskModalOpen}
        onClose={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
          setSelectedTaskToEdit(null)
        }}
        buildingId={headerConversation.activeBuildingId}
        managerId={profileId || headerConversation.currentUserId}
        conciergeId={
          headerConversation.contactRole === 'concierge'
            ? headerConversation.contactId
            : null
        }
        sourceMessageId={messageTaskSourceId}
        onCreated={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
          setSelectedTaskToEdit(null)
          if (profileId || headerConversation.currentUserId) {
            void refreshManagerTasks(profileId || headerConversation.currentUserId)
          }
        }}
        initialValues={messageTaskDraft}
        taskToEdit={selectedTaskToEdit}
        buildingOptions={buildings}
      />

      <ManagerAgendaEventModal
        open={eventModalOpen}
        title={eventTitle}
        date={eventDate}
        buildingId={eventBuildingId}
        buildingOptions={buildings}
        location={eventLocation}
        category={eventCategory}
        notes={eventNotes}
        saving={savingEvent}
        onClose={() => {
          setEventModalOpen(false)
          setFeedbackMessage('')
        }}
        onChangeTitle={handleEventTitleChange}
        onChangeDate={setEventDate}
        onChangeBuilding={setEventBuildingId}
        onChangeLocation={(value) => {
          setEventLocation(value)
          setEventLocationEditedManually(true)
        }}
        onChangeCategory={(value) => {
          setEventCategory(value)
          setEventCategoryEditedManually(true)
        }}
        onChangeNotes={setEventNotes}
        onSubmit={handleCreateConciergeEvent}
      />
    </>
  )
}
