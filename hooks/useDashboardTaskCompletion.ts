'use client'

import { useEffect, useState } from 'react'

import { requiresInventoryFlow } from '@/lib/inventory/taskInventoryCategories'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type TaskInventoryCompletionApi = {
  requestCompletion: (
    task: EditableTask,
    updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<boolean | void>
  ) => Promise<void>
}

type UseDashboardTaskCompletionParams = {
  tasks: EditableTask[]
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<boolean | void>
  taskInventory: TaskInventoryCompletionApi
}

type UndoCompleteState = {
  taskId: string
  taskTitle: string
  previousStatus: 'pending' | 'in_progress'
  timeoutId: ReturnType<typeof setTimeout>
}

export function useDashboardTaskCompletion({
  tasks,
  updateTaskStatus,
  taskInventory,
}: UseDashboardTaskCompletionParams) {
  const [undoComplete, setUndoComplete] = useState<UndoCompleteState | null>(null)

  const scheduleUndo = async (task: EditableTask) => {
    if (undoComplete) {
      clearTimeout(undoComplete.timeoutId)
    }

    const didComplete = await updateTaskStatus(task.id, 'completed')
    if (!didComplete) return

    const timeoutId = setTimeout(() => {
      setUndoComplete((current) => (current?.taskId === task.id ? null : current))
    }, 5000)

    setUndoComplete({
      taskId: task.id,
      taskTitle: task.title,
      previousStatus: task.status === 'in_progress' ? 'in_progress' : 'pending',
      timeoutId,
    })
  }

  const requestTaskCompletion = async (task: EditableTask) => {
    if (requiresInventoryFlow(task.category)) {
      await taskInventory.requestCompletion(task, updateTaskStatus)
      return
    }

    await scheduleUndo(task)
  }

  const requestTaskCompletionById = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    await requestTaskCompletion(task)
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

  return {
    undoComplete,
    requestTaskCompletion,
    requestTaskCompletionById,
    requestTaskSwipeCompletion: requestTaskCompletion,
    undoCompletedTask,
  }
}
