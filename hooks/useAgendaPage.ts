'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { resolveConciergeBuildingContext } from '@/lib/buildings/conciergeBuildingContext'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'
import {
  TASK_SELECT_FIELDS,
  normalizeTask,
  toEditableTask,
} from '@/lib/tasks/taskHelpers'
import { exportTasksToExcel } from '@/lib/tasks/exportTasksToExcel'
import { updateTaskStatusWithTreatment } from '@/lib/tasks/taskStatusActions'
import type { EditableTask } from '@/lib/tasks/taskTypes'
import type {
  AgendaTask,
  GroupedAgendaTasks,
  NextTaskCard,
} from '@/components/agenda/AgendaTypes'
import {
  getAgendaDays,
  getDateKey,
  getGroupedAgendaTasks,
  getMonthLabel,
  getMonthlyStats,
  getNextTaskCard,
  getQuickViewStats,
  getQuickViewTasks,
  getSelectedDateLabel,
  getSelectedStats,
  getTasksForCurrentMonth,
  getTasksForDayByKey,
} from '@/lib/agenda/agendaHelpers'

export function useAgendaPage(selectedBuildingId?: string | null) {
  const locale = useLocale()
  const t = useTranslations()

  const [tasks, setTasks] = useState<AgendaTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    getDateKey(new Date())
  )
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<EditableTask | null>(null)
  const [buildingName, setBuildingName] = useState('')
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [buildingId, setBuildingId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [animDirection, setAnimDirection] = useState(1)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [undoDelete, setUndoDelete] = useState<{
    task: AgendaTask
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  const todayKey = getDateKey(new Date())
  const isSelectedDateToday = selectedDate === todayKey

  const monthLabel = useMemo(
    () => getMonthLabel(currentMonth, locale) || '',
    [currentMonth, locale]
  )

  const days = useMemo(
    () => getAgendaDays(currentMonth, tasks, todayKey),
    [currentMonth, tasks, todayKey]
  )

  const tasksForDay = useMemo(
    () => getTasksForDayByKey(tasks, selectedDate),
    [tasks, selectedDate]
  )

  const groupedTasks = useMemo<GroupedAgendaTasks>(
    () => getGroupedAgendaTasks(tasksForDay),
    [tasksForDay]
  )

  const quickViewTasks = useMemo(
    () => getQuickViewTasks(tasksForDay),
    [tasksForDay]
  )

  const quickViewStats = useMemo(
    () => getQuickViewStats(tasksForDay),
    [tasksForDay]
  )

  const nextTaskCard = useMemo<NextTaskCard | null>(
    () => getNextTaskCard(selectedDate, tasksForDay, isSelectedDateToday),
    [selectedDate, tasksForDay, isSelectedDateToday]
  )

  const selectedDateLabel = useMemo(
    () => getSelectedDateLabel(selectedDate, locale),
    [selectedDate, locale]
  )

  const selectedStats = useMemo(
    () => getSelectedStats(tasksForDay),
    [tasksForDay]
  )

  const tasksForCurrentMonth = useMemo(
    () => getTasksForCurrentMonth(tasks, currentMonth),
    [tasks, currentMonth]
  )

  const monthlyStats = useMemo(
    () => getMonthlyStats(tasksForCurrentMonth),
    [tasksForCurrentMonth]
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const { profileId, buildings, building } =
        await resolveConciergeBuildingContext(selectedBuildingId)

      setProfileId(profileId)
      setBuildings(buildings)

      if (!building) {
        console.error('Error obteniendo edificio: sin edificio asignado')
        setLoading(false)
        return
      }

      setBuildingId(building.id)
      setBuildingName(building.name)

      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT_FIELDS)
        .eq('building_id', building.id)

      if (error) {
        console.error('Error obteniendo tareas:', error)
        setTasks([])
      } else {
        setTasks(((data as AgendaTask[]) || []).map(normalizeTask))
      }
    } finally {
      setLoading(false)
    }
  }, [selectedBuildingId])

  const updateTaskStatus = async (
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed',
    reason?: string
  ) => {
    const previousTasks = tasks
    const currentTask = tasks.find((task) => task.id === taskId)

    if (!currentTask) return false

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              completed_at:
                status === 'completed'
                  ? new Date().toISOString()
                  : status === 'pending' || status === 'in_progress'
                    ? null
                    : task.completed_at,
            }
          : task
      )
    )

    try {
      await updateTaskStatusWithTreatment({
        task: currentTask,
        nextStatus: status,
        buildingId,
        profileId,
        reason,
      })
      return true
    } catch (error) {
      console.error('Error actualizando estado:', error)
      setTasks(previousTasks)
      return false
    }
  }

  const finalizeDelete = useCallback(
    async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)

      if (error) {
        console.error('Error eliminando tarea:', error)
        await fetchData()
      }
    },
    [fetchData]
  )

  const deleteTask = useCallback(
    (taskId: string) => {
      const taskToDelete = tasks.find((task) => task.id === taskId)

      if (!taskToDelete) return

      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
        void finalizeDelete(undoDelete.task.id)
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      setExpandedTaskId((prev) => (prev === taskId ? null : prev))

      const timeoutId = setTimeout(() => {
        void finalizeDelete(taskId)
        setUndoDelete(null)
      }, 5000)

      setUndoDelete({ task: taskToDelete, timeoutId })
    },
    [finalizeDelete, tasks, undoDelete]
  )

  const undoDeleteTask = useCallback(() => {
    if (!undoDelete) return

    clearTimeout(undoDelete.timeoutId)
    setTasks((prev) => [...prev, undoDelete.task])
    setUndoDelete(null)
  }, [undoDelete])

  useEffect(() => {
    return () => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
      }
    }
  }, [undoDelete])

  const changeMonth = (direction: -1 | 1) => {
    setAnimDirection(direction)
    setCurrentMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + direction)
      return next
    })
    setSelectedDate(null)
    setExpandedTaskId(null)
  }

  const goToToday = () => {
    const today = new Date()
    const todayDateKey = getDateKey(today)
    const current = selectedDate
      ? new Date(`${selectedDate}T12:00:00`).getTime()
      : 0
    const next = new Date(`${todayDateKey}T12:00:00`).getTime()

    setAnimDirection(next >= current ? 1 : -1)
    setCurrentMonth(today)
    setSelectedDate(todayDateKey)
    setExpandedTaskId(null)
  }

  const handleSelectDate = (date: string) => {
    const current = selectedDate
      ? new Date(`${selectedDate}T12:00:00`).getTime()
      : 0
    const next = new Date(`${date}T12:00:00`).getTime()

    setAnimDirection(next >= current ? 1 : -1)
    setSelectedDate(date)
    setExpandedTaskId(null)
  }

  const openCreateModal = () => {
    setSelectedTask(null)
    setModalOpen(true)
  }

  const openEditModal = (task: AgendaTask) => {
    setSelectedTask(toEditableTask(task))
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedTask(null)
  }

  const handleExportMonth = () => {
    void exportTasksToExcel({
      tasks: tasksForCurrentMonth,
      buildingName: buildingName || t('noBuilding'),
      locale,
      t,
    })
  }

  return {
    tasks,
    loading,
    selectedDate,
    currentMonth,
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
    tasksForCurrentMonth,
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
  }
}
