'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageSquareMore, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  fetchBuildingsForUser,
  type BuildingSummary,
} from '@/lib/buildings/buildingMembershipService'
import AgendaCalendar from '@/components/agenda/AgendaCalendar'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerRootBottomNav from '@/components/layout/ManagerRootBottomNav'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import ManagerPrivateTaskCard from '@/components/manager/ManagerPrivateTaskCard'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import StyledDropdown from '@/components/ui/StyledDropdown'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import {
  deleteManagerTask,
  fetchManagerTasksForManager,
  updateManagerTaskStatus,
  type ManagerTask,
} from '@/lib/manager/managerTaskService'
import { exportManagerTasksToExcel } from '@/lib/manager/exportManagerTasks'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import {
  getAgendaDays,
  getDateKey,
  getMonthLabel,
  getMonthlyStats,
  getSelectedDateLabel,
} from '@/lib/agenda/agendaHelpers'
import type { AgendaDayItem } from '@/components/agenda/AgendaTypes'
import type { TaskDraft, TaskStatus } from '@/lib/tasks/taskTypes'

type StatusFilter = 'all' | 'active' | 'completed' | 'overdue'

function getManagerTasksForMonth(tasks: ManagerTask[], currentMonth: Date) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  return tasks.filter((task) => {
    const date = new Date(`${task.task_date}T12:00:00`)
    return date.getFullYear() === year && date.getMonth() === month
  })
}

function toCalendarDays(
  currentMonth: Date,
  tasks: ManagerTask[],
  todayKey: string
): AgendaDayItem[] {
  return getAgendaDays(
    currentMonth,
    tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      apartment_or_area: task.apartment_or_area,
      apartment_key: null,
      category: 'other',
      priority: task.priority,
      status: task.status,
      task_date: task.task_date,
      task_time: task.task_time,
      completed_at: task.completed_at,
      pest_targets: [],
      task_apartments: [],
      task_photos: [],
    })),
    todayKey
  )
}

export default function ManagerPrivateAgendaPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  const headerConversation = useHeaderConversation()
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)

  const [profileId, setProfileId] = useState('')
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [tasks, setTasks] = useState<ManagerTask[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(
    getDateKey(new Date())
  )
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null)
  const [selectedTaskToEdit, setSelectedTaskToEdit] =
    useState<ManagerTask | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [undoDelete, setUndoDelete] = useState<{
    task: ManagerTask
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  const todayKey = getDateKey(new Date())

  const buildingNameById = useMemo(
    () =>
      buildings.reduce<Record<string, string>>((map, building) => {
        map[building.id] = building.name
        return map
      }, {}),
    [buildings]
  )

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesBuilding =
        buildingFilter === 'all' ||
        (buildingFilter === 'general'
          ? !task.building_id
          : task.building_id === buildingFilter)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? task.status !== 'completed'
          : statusFilter === 'completed'
            ? task.status === 'completed'
            : task.status !== 'completed' && task.task_date < todayKey)

      return matchesBuilding && matchesStatus
    })
  }, [buildingFilter, statusFilter, tasks, todayKey])

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return []

    return filteredTasks
      .filter((task) => task.task_date === selectedDate)
      .sort((a, b) => {
        const timeCompare = (a.task_time || '99:99').localeCompare(
          b.task_time || '99:99'
        )
        if (timeCompare !== 0) return timeCompare
        return a.priority.localeCompare(b.priority)
      })
  }, [filteredTasks, selectedDate])

  const days = useMemo(
    () => toCalendarDays(currentMonth, filteredTasks, todayKey),
    [currentMonth, filteredTasks, todayKey]
  )

  const tasksForCurrentMonth = useMemo(
    () => getManagerTasksForMonth(filteredTasks, currentMonth),
    [currentMonth, filteredTasks]
  )

  const monthlyStats = useMemo(
    () =>
      getMonthlyStats(
        tasksForCurrentMonth.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          apartment_or_area: task.apartment_or_area,
          apartment_key: null,
          category: 'other',
          priority: task.priority,
          status: task.status,
          task_date: task.task_date,
          task_time: task.task_time,
          completed_at: task.completed_at,
        }))
      ),
    [tasksForCurrentMonth]
  )

  const loadAgenda = useCallback(async () => {
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
      .select('id, role')
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

    try {
      const [nextBuildings, nextTasks] = await Promise.all([
        fetchBuildingsForUser({ userId: profile.id, role: 'manager' }),
        fetchManagerTasksForManager(profile.id),
      ])

      setBuildings(nextBuildings)
      setTasks(nextTasks)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la agenda del manager.'
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadAgenda()
  }, [loadAgenda])

  useEffect(() => {
    return () => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
      }
    }
  }, [undoDelete])

  const openCreateModal = (date = selectedDate) => {
    setSelectedTaskToEdit(null)
    setMessageTaskSourceId(null)
    setTaskDraft({
      task_date: date || todayKey,
      category: 'other',
      priority: 'medium',
    })
    setTaskModalOpen(true)
  }

  const handleStatusChange = async (task: ManagerTask, status: TaskStatus) => {
    if (!profileId) return

    const previousTasks = tasks
    setTasks((current) =>
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
        managerId: profileId,
        status,
      })
    } catch (error) {
      setTasks(previousTasks)
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo actualizar la tarea.'
      )
    }
  }

  const finalizeDelete = useCallback(
    async (taskId: string) => {
      if (!profileId) return

      try {
        await deleteManagerTask({ taskId, managerId: profileId })
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo borrar la tarea.'
        )
        await loadAgenda()
      }
    },
    [loadAgenda, profileId]
  )

  const handleDelete = (task: ManagerTask) => {
    if (undoDelete) {
      clearTimeout(undoDelete.timeoutId)
      void finalizeDelete(undoDelete.task.id)
    }

    setTasks((current) => current.filter((item) => item.id !== task.id))
    setExpandedTaskId((current) => (current === task.id ? null : current))

    const timeoutId = setTimeout(() => {
      void finalizeDelete(task.id)
      setUndoDelete(null)
    }, 5000)

    setUndoDelete({ task, timeoutId })
  }

  const undoDeleteTask = () => {
    if (!undoDelete) return

    clearTimeout(undoDelete.timeoutId)
    setTasks((current) => [...current, undoDelete.task])
    setUndoDelete(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">Cargando agenda...</p>
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
            title="Agenda"
            flatBottom
            rightSlot={
              compactHeader ? (
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)]"
                  aria-label="Nueva tarea administrativa"
                >
                  <Plus size={20} />
                </button>
              ) : null
            }
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8C9AB3]">
                    Tareas administrativas
                  </p>
                  <p className="max-w-[270px] text-[15px] leading-7 text-[#5E6E8C]">
                    Organiza seguimientos, recordatorios y pendientes internos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="flex w-full items-center justify-center gap-3 rounded-[30px] bg-[#2F66C8] px-5 py-4 text-[18px] font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.24)]"
                >
                  <Plus size={24} />
                  Nueva tarea administrativa
                </button>
              </div>
            }
          />

          <section ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-36 pt-4">
            {errorMessage ? (
              <div className="mb-4 rounded-3xl border border-[#F1D3D3] bg-[#FFF5F5] px-5 py-4 text-sm font-medium text-[#C53030]">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-4">
              <section className="rounded-[28px] border border-[#E3EAF3] bg-white p-4 shadow-[0_8px_22px_rgba(20,41,82,0.05)]">
                <div className="mb-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#8C9AB3]">
                    Filtros
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6E7F9D]">
                    Escoge un edificio y un estado para ver solo esas tareas.
                    La exportacion usa estos mismos filtros.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StyledDropdown
                    label="Edificio"
                    ariaLabel="Filtrar por edificio"
                    value={buildingFilter}
                    options={[
                      { value: 'all', label: 'Todos los edificios' },
                      { value: 'general', label: 'General' },
                      ...buildings.map((building) => ({
                        value: building.id,
                        label: building.name,
                      })),
                    ]}
                    onChange={setBuildingFilter}
                    zIndexClassName="z-30"
                  />

                  <StyledDropdown
                    label="Estado"
                    ariaLabel="Filtrar por estado"
                    value={statusFilter}
                    options={[
                      { value: 'all', label: 'Todos los estados' },
                      { value: 'active', label: 'Pendientes' },
                      { value: 'overdue', label: 'Vencidas' },
                      { value: 'completed', label: 'Completadas' },
                    ]}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                    zIndexClassName="z-30"
                  />
                </div>
              </section>

              <AgendaCalendar
                monthLabel={getMonthLabel(currentMonth, locale)}
                monthlyStats={monthlyStats}
                days={days}
                selectedDate={selectedDate}
                onChangeMonth={(direction) => {
                  setCurrentMonth((current) => {
                    const next = new Date(current)
                    next.setMonth(current.getMonth() + direction)
                    return next
                  })
                }}
                onSelectDate={setSelectedDate}
                onCreateTask={() => openCreateModal()}
                exportLabel="Exportar"
                onExportMonth={() =>
                  void exportManagerTasksToExcel({
                    tasks: tasksForCurrentMonth,
                    buildingNameById,
                    locale,
                    t,
                    fileScope: `agenda_${buildingFilter}_${statusFilter}`,
                  })
                }
                onTouchStart={() => {}}
                onTouchMove={() => {}}
                onTouchEnd={() => {}}
              />

              <section className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm capitalize text-[#6E7F9D]">
                      {getSelectedDateLabel(selectedDate, locale)}
                    </p>
                    <h2 className="mt-1 text-[24px] font-bold text-[#142952]">
                      Tareas del dia
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-sm font-bold text-[#2F66C8]">
                    {tasksForSelectedDate.length}
                  </span>
                </div>

                {tasksForSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {tasksForSelectedDate.map((task) => (
                      <ManagerPrivateTaskCard
                        key={task.id}
                        task={task}
                        buildingName={
                          task.building_id
                            ? buildingNameById[task.building_id] || 'Edificio'
                            : 'General'
                        }
                        expanded={expandedTaskId === task.id}
                        onToggleExpand={() =>
                          setExpandedTaskId((current) =>
                            current === task.id ? null : task.id
                          )
                        }
                        onStatusChange={(status) =>
                          void handleStatusChange(task, status)
                        }
                        onEdit={() => {
                          setSelectedTaskToEdit(task)
                          setTaskDraft(null)
                          setMessageTaskSourceId(null)
                          setTaskModalOpen(true)
                        }}
                        onDelete={() => void handleDelete(task)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[#D8E2F0] bg-[#F9FBFE] px-5 py-10 text-center">
                    <p className="text-base font-medium text-[#142952]">
                      No hay tareas administrativas para este dia.
                    </p>
                    <button
                      type="button"
                      onClick={() => openCreateModal()}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#3E63E6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(62,99,230,0.22)]"
                    >
                      <Plus className="h-4 w-4" />
                      Crear para este dia
                    </button>
                  </div>
                )}
              </section>
            </div>
          </section>

          {undoDelete ? (
            <UndoDeleteToast
              taskTitle={undoDelete.task.title}
              onUndo={undoDeleteTask}
            />
          ) : null}

          <ManagerRootBottomNav active="agenda" />
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
          setTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setMessageTaskSourceId(message.id)
          headerConversation.closeConversation()
          setTaskModalOpen(true)
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
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setTaskDraft(null)
          setSelectedTaskToEdit(null)
          setMessageTaskSourceId(null)
        }}
        buildingId={headerConversation.activeBuildingId || null}
        managerId={profileId || headerConversation.currentUserId}
        conciergeId={
          headerConversation.contactRole === 'concierge'
            ? headerConversation.contactId
            : null
        }
        sourceMessageId={messageTaskSourceId}
        initialValues={taskDraft}
        taskToEdit={selectedTaskToEdit}
        buildingOptions={buildings}
        onCreated={async () => {
          setTaskModalOpen(false)
          setTaskDraft(null)
          setSelectedTaskToEdit(null)
          setMessageTaskSourceId(null)
          await loadAgenda()
        }}
      />
    </>
  )
}
