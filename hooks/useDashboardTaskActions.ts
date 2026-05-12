'use client'

import { useCallback, useEffect, useState } from 'react'
import { updateTaskStatusWithTreatment } from '@/lib/tasks/taskStatusActions'
import { deleteDashboardTask } from '@/lib/dashboard/dashboardService'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type DashboardTask = EditableTask

type UseDashboardTaskActionsParams = {
  buildingId: string
  profileId: string
  tasks: DashboardTask[]
  setTasks: React.Dispatch<React.SetStateAction<DashboardTask[]>>
  onReload: () => Promise<void>
  onCollapseTask: (taskId: string) => void
}

export function useDashboardTaskActions({
  buildingId,
  profileId,
  tasks,
  setTasks,
  onReload,
  onCollapseTask,
}: UseDashboardTaskActionsParams) {
  const [undoDelete, setUndoDelete] = useState<{
    task: DashboardTask
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

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
        await updateTaskStatusWithTreatment({
          task: currentTask,
          nextStatus: status,
          buildingId,
          profileId,
          reason,
        })

        await onReload()
        return true
      } catch (error) {
        console.error('Error actualizando estado:', error)
        setTasks(previousTasks)
        return false
      }
    },
    [buildingId, onReload, profileId, setTasks, tasks]
  )

  const finalizeDelete = useCallback(
    async (taskId: string) => {
      try {
        await deleteDashboardTask(taskId)
      } catch (error) {
        console.error('Error eliminando tarea:', error)
        await onReload()
      }
    },
    [onReload]
  )

  const queueDeleteTask = useCallback(
    (task: DashboardTask) => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
        void finalizeDelete(undoDelete.task.id)
      }

      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      onCollapseTask(task.id)

      const timeoutId = setTimeout(() => {
        void finalizeDelete(task.id)
        setUndoDelete(null)
      }, 5000)

      setUndoDelete({ task, timeoutId })
    },
    [finalizeDelete, onCollapseTask, setTasks, undoDelete]
  )

  const undoDeleteTask = useCallback(() => {
    if (!undoDelete) return

    clearTimeout(undoDelete.timeoutId)
    setTasks((prev) => [...prev, undoDelete.task])
    setUndoDelete(null)
  }, [setTasks, undoDelete])

  useEffect(() => {
    return () => {
      if (undoDelete) {
        clearTimeout(undoDelete.timeoutId)
      }
    }
  }, [undoDelete])

  return {
    queueDeleteTask,
    undoDelete,
    undoDeleteTask,
    updateTaskStatus,
  }
}
