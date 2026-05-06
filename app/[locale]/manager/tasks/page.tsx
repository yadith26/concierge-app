'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  ClipboardList,
  Download,
  MessageSquareMore,
  Plus,
  Search,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerRootBottomNav from '@/components/layout/ManagerRootBottomNav'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import ManagerPrivateTaskCard from '@/components/manager/ManagerPrivateTaskCard'
import ManagerTaskFilters from '@/components/manager/tasks/ManagerTaskFilters'
import UndoDeleteToast from '@/components/tasks/UndoDeleteToast'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import {
  fetchBuildingsForUser,
  type BuildingSummary,
} from '@/lib/buildings/buildingMembershipService'
import {
  deleteManagerTask,
  fetchManagerTasksForManager,
  updateManagerTaskStatus,
  type ManagerTask,
} from '@/lib/manager/managerTaskService'
import { exportManagerTasksToExcel } from '@/lib/manager/exportManagerTasks'
import type { TaskFilter } from '@/lib/manager/managerDashboardTypes'

export default function ManagerTasksPage() {
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
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTaskToEdit, setSelectedTaskToEdit] =
    useState<ManagerTask | null>(null)
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [search, setSearch] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [undoDelete, setUndoDelete] = useState<{
    task: ManagerTask
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  const loadTasksPage = useCallback(async () => {
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
          : 'No se pudieron cargar las tareas del manager.'
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadTasksPage()
  }, [loadTasksPage])

  useEffect(() => {
    return () => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
      }
    }
  }, [undoDelete])

  const finalizeDelete = useCallback(
    async (taskId: string) => {
      if (!profileId) return

      try {
        await deleteManagerTask({
          taskId,
          managerId: profileId,
        })
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo borrar la tarea.'
        )
        await loadTasksPage()
      }
    },
    [loadTasksPage, profileId]
  )

  const queueDeleteTask = useCallback(
    (task: ManagerTask) => {
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
    },
    [finalizeDelete, undoDelete]
  )

  const undoDeleteTask = useCallback(() => {
    if (!undoDelete) return

    clearTimeout(undoDelete.timeoutId)
    setTasks((current) => [...current, undoDelete.task])
    setUndoDelete(null)
  }, [undoDelete])

  const summary = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const pendingTasks = tasks.filter((task) => task.status !== 'completed')
    const completedTasks = tasks.filter((task) => task.status === 'completed')

    const compareDate = (task: ManagerTask) => {
      const taskDate = new Date(`${task.task_date}T12:00:00`)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime()
    }

    const todayTime = today.getTime()

    return {
      completedTasks,
      monthTasks: tasks.filter((task) => {
        const taskDate = new Date(`${task.task_date}T12:00:00`)
        return (
          taskDate.getMonth() === currentMonth &&
          taskDate.getFullYear() === currentYear
        )
      }),
      overdueTasks: pendingTasks.filter((task) => compareDate(task) < todayTime),
      pendingTasks,
      todayTasks: pendingTasks.filter((task) => compareDate(task) === todayTime),
      upcomingTasks: pendingTasks.filter((task) => compareDate(task) > todayTime),
      urgentTasks: pendingTasks.filter((task) => task.priority === 'high'),
    }
  }, [tasks])
  const buildingNameById = useMemo(
    () =>
      buildings.reduce<Record<string, string>>((map, building) => {
        map[building.id] = building.name
        return map
      }, {}),
    [buildings]
  )

  const baseFilteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return summary.todayTasks
      case 'overdue':
        return summary.overdueTasks
      case 'upcoming':
        return summary.upcomingTasks
      case 'urgent':
        return summary.urgentTasks
      case 'completed':
        return summary.completedTasks
      case 'pending':
        return summary.pendingTasks
      case 'all':
      default:
        return summary.monthTasks
    }
  }, [activeFilter, summary])

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return baseFilteredTasks

    return baseFilteredTasks.filter((task) => {
      const haystack = [
        task.title,
        task.description,
        task.apartment_or_area,
        task.category,
        task.building_id ? buildingNameById[task.building_id] : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [baseFilteredTasks, buildingNameById, search])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">Cargando tareas...</p>
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
            title="Tareas"
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
            rightSlot={
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#7B8BA8] shadow-[0_10px_24px_rgba(20,41,82,0.08)] transition hover:bg-white"
                aria-label="Notificaciones"
              >
                <Bell size={22} />
              </button>
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
                  onClick={() => {
                    setSelectedTaskToEdit(null)
                    setModalOpen(true)
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-[30px] bg-[#4D63E4] px-6 py-5 text-lg font-bold text-white shadow-[0_16px_30px_rgba(77,99,228,0.28)] transition hover:bg-[#4157D9]"
                >
                  <Plus size={28} strokeWidth={2.3} />
                  Nueva tarea administrativa
                </button>
              </div>
            }
          />

          <section
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-5 pb-32 pt-4"
          >
            {errorMessage ? (
              <div className="mb-4 rounded-3xl border border-[#F1D3D3] bg-[#FFF5F5] px-5 py-4 text-sm font-medium text-[#C53030]">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-6">
              <section className="rounded-[30px] bg-white p-5 shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#F3F6FB] px-4 py-4">
                    <Search size={18} className="text-[#7B8BA8]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar tareas..."
                      className="w-full bg-transparent text-sm text-[#142952] outline-none placeholder:text-[#8A97B0]"
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#F3F6FB] px-4 py-4 text-[15px] text-[#142952]">
                    <ClipboardList size={18} className="text-[#7B8BA8]" />
                    Todas las categorías
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#8C9AB3]">
                      Filtros
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#6E7F9D]">
                      Toca una opcion para cambiar las tareas que se muestran.
                    </p>
                  </div>

                  <ManagerTaskFilters
                    activeFilter={activeFilter}
                    onChange={(filter) => {
                      setActiveFilter(filter as TaskFilter)
                      setExpandedTaskId(null)
                    }}
                  />

                  <p className="rounded-2xl bg-[#F8FAFE] px-4 py-3 text-xs font-medium leading-5 text-[#6E7F9D]">
                    Exportar vista descarga solo las tareas que ves ahora, segun
                    el filtro y la busqueda actual.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void exportManagerTasksToExcel({
                        tasks: filteredTasks,
                        buildingNameById,
                        locale,
                        t,
                        fileScope: activeFilter,
                      })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D9E4F2] bg-white px-4 py-3 text-sm font-bold text-[#2F66C8] shadow-sm"
                  >
                    <Download size={17} />
                    Exportar vista
                  </button>
                </div>
              </section>

              {summary.overdueTasks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('overdue')
                    setExpandedTaskId(null)
                  }}
                  className="flex w-full items-center justify-between rounded-[30px] border border-[#E8C9A3] bg-white px-6 py-6 text-left shadow-[0_10px_28px_rgba(20,41,82,0.04)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F8F1E8] text-[#B8742F]">
                      <span className="text-[28px] leading-none">!</span>
                    </div>

                    <div>
                      <p className="text-[15px] font-extrabold uppercase tracking-[0.06em] text-[#B8742F]">
                        Atrasadas
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#7B8BA8]">
                        Toca para verlas
                      </p>
                    </div>
                  </div>

                  <span className="text-[44px] font-extrabold leading-none text-[#B8742F]">
                    {summary.overdueTasks.length}
                  </span>
                </button>
              ) : null}

              <div className="space-y-4">
                <div className="px-1">
                  <h2 className="text-[20px] font-extrabold uppercase tracking-[0.02em] text-[#667796]">
                    {activeFilter === 'today'
                      ? 'Tareas de hoy'
                      : activeFilter === 'overdue'
                        ? 'Tareas atrasadas'
                        : activeFilter === 'upcoming'
                          ? 'Próximas tareas'
                          : activeFilter === 'urgent'
                            ? 'Tareas urgentes'
                            : activeFilter === 'completed'
                              ? 'Tareas completadas'
                              : activeFilter === 'pending'
                                ? 'Tareas pendientes'
                                : 'Todas las tareas'}
                  </h2>
                </div>

                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
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
                          setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                        }
                        onStatusChange={async (status) => {
                          if (!profileId) return
                          await updateManagerTaskStatus({
                            taskId: task.id,
                            managerId: profileId,
                            status,
                          })
                          await loadTasksPage()
                        }}
                        onEdit={() => {
                          setSelectedTaskToEdit(task)
                          setModalOpen(true)
                        }}
                        onDelete={async () => {
                          queueDeleteTask(task)
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
                    <p className="text-base font-semibold text-[#6E7F9D]">
                      No hay tareas en esta categoría
                    </p>
                    <p className="mt-2 text-sm text-[#93A1BA]">
                      Puedes crear una nueva tarea para el manager.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {undoDelete ? (
            <UndoDeleteToast
              taskTitle={undoDelete.task.title}
              onUndo={undoDeleteTask}
            />
          ) : null}

          <ManagerRootBottomNav active="tasks" />
        </div>
      </main>

      <ManagerTaskFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTaskToEdit(null)
        }}
        managerId={profileId}
        buildingOptions={buildings}
        taskToEdit={selectedTaskToEdit}
        onCreated={async () => {
          setModalOpen(false)
          setSelectedTaskToEdit(null)
          await loadTasksPage()
        }}
      />
    </>
  )
}
