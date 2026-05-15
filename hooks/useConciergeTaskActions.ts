'use client'

import { useCallback, useEffect, useState } from 'react'
import { requiresInventoryFlow } from '@/lib/inventory/taskInventoryCategories'
import type { EditableTask, TaskStatus } from '@/lib/tasks/taskTypes'

type TaskInventoryCompletionApi = {
  requestCompletion: (
    task: EditableTask,
    updateTaskStatus: (
      taskId: string,
      status: TaskStatus
    ) => Promise<boolean | void>
  ) => Promise<void>
}

type ReopenReasonApi = {
  requestReopen: (request: {
    taskTitle: string
    onConfirm: (reason: string) => Promise<boolean> | boolean
  }) => void
}

type UseConciergeTaskActionsParams = {
  tasks: EditableTask[]
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    reason?: string
  ) => Promise<boolean | void>
  taskInventory: TaskInventoryCompletionApi
  reopenReason: ReopenReasonApi
}

type UndoCompleteState = {
  taskId: string
  taskTitle: string
  previousStatus: 'pending' | 'in_progress'
  timeoutId: ReturnType<typeof setTimeout>
}

export function useConciergeTaskActions({
  tasks,
  updateTaskStatus,
  taskInventory,
  reopenReason,
}: UseConciergeTaskActionsParams) {
  const [undoComplete, setUndoComplete] = useState<UndoCompleteState | null>(null)

  const findTask = useCallback(
    (taskId: string) => tasks.find((task) => task.id === taskId) || null,
    [tasks]
  )

  const completeTask = useCallback(
    async (task: EditableTask) => {
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
        previousStatus:
          task.status === 'in_progress' ? 'in_progress' : 'pending',
        timeoutId,
      })
    },
    [taskInventory, undoComplete, updateTaskStatus]
  )

  const completeTaskById = useCallback(
    async (taskId: string) => {
      const task = findTask(taskId)
      if (!task) return

      await completeTask(task)
    },
    [completeTask, findTask]
  )

  const setPendingTaskById = useCallback(
    (taskId: string) => {
      const task = findTask(taskId)
      if (!task) return

      if (task.status === 'completed') {
        reopenReason.requestReopen({
          taskTitle: task.title,
          onConfirm: async (reason) => {
            const didUpdate = await updateTaskStatus(task.id, 'pending', reason)
            return didUpdate !== false
          },
        })
        return
      }

      void updateTaskStatus(task.id, 'pending')
    },
    [findTask, reopenReason, updateTaskStatus]
  )

  const undoCompletedTask = useCallback(async () => {
    if (!undoComplete) return

    clearTimeout(undoComplete.timeoutId)
    const { taskId, previousStatus } = undoComplete
    setUndoComplete(null)
    await updateTaskStatus(taskId, previousStatus)
  }, [undoComplete, updateTaskStatus])

  useEffect(() => {
    return () => {
      if (undoComplete) {
        clearTimeout(undoComplete.timeoutId)
      }
    }
  }, [undoComplete])

  return {
    undoComplete,
    completeTask,
    completeTaskById,
    swipeCompleteTaskById: completeTaskById,
    setPendingTaskById,
    undoCompletedTask,
  }
}
