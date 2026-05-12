'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTasksPageData } from '@/lib/tasks/taskQueries'
import {
  deleteTaskById,
  updateTaskStatusWithLogic,
} from '@/lib/tasks/taskMutations'
import { toEditableTask } from '@/lib/tasks/taskHelpers'
import type { EditableTask, Task } from '@/lib/tasks/taskTypes'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'
import type {
  CategoryFilter,
  StatusFilter,
  UndoDeleteState,
} from '@/lib/tasks/taskPageTypes'

function normalizeStatusFilter(value?: string | null): StatusFilter {
  if (
    value === 'today' ||
    value === 'pending' ||
    value === 'in_progress' ||
    value === 'completed' ||
    value === 'urgent' ||
    value === 'overdue'
  ) {
    return value
  }

  return 'all'
}

function getDateKey(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-CA')
}

function compareTasks(a: Task, b: Task) {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const statusOrder = { pending: 0, in_progress: 1, completed: 2 }

  const aDateTime = new Date(
    `${a.task_date}T${a.task_time && a.task_time.trim() ? a.task_time : '23:59'}`
  ).getTime()

  const bDateTime = new Date(
    `${b.task_date}T${b.task_time && b.task_time.trim() ? b.task_time : '23:59'}`
  ).getTime()

  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  }

  if (aDateTime !== bDateTime) {
    return aDateTime - bDateTime
  }

  if (statusOrder[a.status] !== statusOrder[b.status]) {
    return statusOrder[a.status] - statusOrder[b.status]
  }

  return a.title.localeCompare(b.title, 'es')
}

export function useTasksPage(
  selectedBuildingId?: string | null,
  initialStatusFilter?: string | null
) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<EditableTask | null>(null)
  const [buildingName, setBuildingName] = useState('')
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [buildingId, setBuildingId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    normalizeStatusFilter(initialStatusFilter)
  )
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [compactHeader, setCompactHeader] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [undoDelete, setUndoDelete] = useState<UndoDeleteState>(null)

  const fetchTasksData = useCallback(async () => {
    setLoading(true)

    try {
      const data = await fetchTasksPageData(selectedBuildingId)

      setProfileId(data.profileId)
      setBuildingId(data.buildingId)
      setBuildingName(data.buildingName)
      setBuildings(data.buildings)
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error cargando datos de tareas:', error)
      setTasks([])
      setProfileId('')
      setBuildingId('')
      setBuildingName('')
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }, [selectedBuildingId])

  useEffect(() => {
    void fetchTasksData()
  }, [fetchTasksData])

  useEffect(() => {
    setStatusFilter(normalizeStatusFilter(initialStatusFilter))
  }, [initialStatusFilter])

  useEffect(() => {
    return () => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
      }
    }
  }, 
  [undoDelete] )
  

  const openCreateModal = useCallback(() => {
    setSelectedTask(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((task: Task) => {
    setSelectedTask(toEditableTask(task))
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedTask(null)
  }, [])

  const updateTaskStatus = useCallback(
    async (
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
        await updateTaskStatusWithLogic({
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
    },
    [tasks, buildingId, profileId]
  )

  const finalizeDelete = useCallback(
    async (taskId: string) => {
      try {
        await deleteTaskById(taskId)
      } catch (error) {
        console.error('Error eliminando tarea:', error)
        await fetchTasksData()
      }
    },
    [fetchTasksData]
  )

  const queueDeleteTask = useCallback(
    (task: Task) => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
        void finalizeDelete(undoDelete.task.id)
      }

      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      setExpandedTaskId((prev) => (prev === task.id ? null : prev))

      const timeoutId = setTimeout(() => {
        void finalizeDelete(task.id)
        setUndoDelete(null)
      }, 5000)

      setUndoDelete({ task, timeoutId })
    },
    [undoDelete, finalizeDelete]
  )

  const undoDeleteTask = useCallback(() => {
    if (!undoDelete) return

    clearTimeout(undoDelete.timeoutId)
    setTasks((prev) => [...prev, undoDelete.task].sort(compareTasks))
    setUndoDelete(null)
  }, [undoDelete])

  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(
    () => today.toLocaleDateString('en-CA'),
    [today]
  )

  const tomorrowKey = useMemo(() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return tomorrow.toLocaleDateString('en-CA')
  }, [today])

  const counts = useMemo(() => {
    const overdueCount = tasks.filter(
      (task) =>
        task.status !== 'completed' && getDateKey(task.task_date) < todayKey
    ).length

    const totalCount = tasks.length
    const urgentCount = tasks.filter(
      (task) => task.priority === 'high' && task.status !== 'completed'
    ).length
    const pendingCount = tasks.filter((task) => task.status === 'pending').length
    const inProgressCount = tasks.filter(
      (task) => task.status === 'in_progress'
    ).length
    const completedCount = tasks.filter(
      (task) => task.status === 'completed'
    ).length

    return {
      overdueCount,
      totalCount,
      urgentCount,
      pendingCount,
      inProgressCount,
      completedCount,
    }
  }, [tasks, todayKey])

  const filteredTasks = useMemo(() => {
    const searchValue = search.toLowerCase().trim()

    return tasks
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchValue) ||
          (task.apartment_or_area || '').toLowerCase().includes(searchValue) ||
          (task.description || '').toLowerCase().includes(searchValue)

        let matchesStatus = true
        const taskKey = getDateKey(task.task_date)

        if (statusFilter === 'pending') {
          matchesStatus = task.status === 'pending'
        } else if (statusFilter === 'in_progress') {
          matchesStatus = task.status === 'in_progress'
        } else if (statusFilter === 'completed') {
          matchesStatus = task.status === 'completed'
        } else if (statusFilter === 'urgent') {
          matchesStatus = task.priority === 'high' && task.status !== 'completed'
        } else if (statusFilter === 'overdue') {
          matchesStatus = task.status !== 'completed' && taskKey < todayKey
        } else if (statusFilter === 'today') {
          matchesStatus = task.status !== 'completed' && taskKey === todayKey
        }

        const matchesCategory =
          categoryFilter === 'all' ? true : task.category === categoryFilter

        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort(compareTasks)
  }, [tasks, search, statusFilter, categoryFilter, todayKey])

  const groupedTasks = useMemo(() => {
    const urgentTasks = filteredTasks.filter(
      (task) =>
        task.status !== 'completed' &&
        task.priority === 'high' &&
        statusFilter !== 'overdue'
    )

    const todayTasks = filteredTasks.filter((task) => {
      const taskKey = getDateKey(task.task_date)

      return (
        task.status !== 'completed' &&
        taskKey === todayKey &&
        (statusFilter === 'all' || statusFilter === 'urgent'
          ? true
          : statusFilter !== 'completed')
      )
    })

    const tomorrowTasks = filteredTasks.filter((task) => {
      const taskKey = getDateKey(task.task_date)
      return task.status !== 'completed' && taskKey === tomorrowKey
    })

    const upcomingTasks = filteredTasks.filter((task) => {
      const taskKey = getDateKey(task.task_date)
      return task.status !== 'completed' && taskKey > tomorrowKey
    })

    const overdueTasks = filteredTasks.filter((task) => {
      const taskKey = getDateKey(task.task_date)
      return task.status !== 'completed' && taskKey < todayKey
    })

    const completedTasks = filteredTasks.filter(
      (task) => task.status === 'completed'
    )

    return {
      urgentTasks,
      todayTasks,
      tomorrowTasks,
      upcomingTasks,
      overdueTasks,
      completedTasks,
    }
  }, [filteredTasks, statusFilter, todayKey, tomorrowKey])

  const showingOnlyOverdue = statusFilter === 'overdue'
  const showingOnlyCompleted = statusFilter === 'completed'
  const showingOnlyToday = statusFilter === 'today'

  return {
    loading,

    tasks,
    filteredTasks,
    ...groupedTasks,

    buildingName,
    buildings,
    buildingId,
    profileId,

    modalOpen,
    selectedTask,

    search,
    statusFilter,
    categoryFilter,
    categoryOpen,
    compactHeader,
    expandedTaskId,
    undoDelete,

    counts,
    showingOnlyOverdue,
    showingOnlyCompleted,
    showingOnlyToday,

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
  }
}
