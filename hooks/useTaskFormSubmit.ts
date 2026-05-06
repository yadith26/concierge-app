'use client'

import { useState } from 'react'
import { createTaskFromForm, updateTaskFromForm } from '@/lib/tasks/taskFormActions'
import { validateTaskForm } from '@/lib/tasks/validateTaskForm'
import { useTaskFollowUpFlow } from '@/hooks/useTaskFollowUpFlow'
import type {
  EditableTask,
  PestTarget,
  TaskCategory,
  TaskPriority,
} from '@/lib/tasks/taskTypes'
import type { FollowUpSourceTask } from '@/lib/tasks/followUpHelpers'
import type { SelectedPhoto } from '@/hooks/useTaskPhotos'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type SmartParsedInput = {
  cleanedTitle?: string | null
}

type UseTaskFormSubmitParams = {
  buildingId: string
  profileId: string
  taskToEdit?: EditableTask | null
  sourceRequestId?: string | null
  title: string
  description: string
  category: TaskCategory | ''
  priority: TaskPriority
  taskDate: string
  taskTime: string
  finalLocation: string
  pestTargets: PestTarget[]
  selectedApartments: TaskApartmentInput[]
  photos: SelectedPhoto[]
  existingPhotos?: EditableTask['task_photos']
  removedPhotoIds: string[]
  smartParsed: SmartParsedInput
  today: string
  resetFormState: () => void
  onClose: () => void
  onCreated?: () => Promise<void> | void
  setMessage: (message: string) => void
}

type UseTaskFormSubmitReturn = {
  saving: boolean
  showFollowUpPrompt: boolean
  followUpSourceTask: FollowUpSourceTask | null
  creatingFollowUp: boolean
  setShowFollowUpPrompt: (value: boolean) => void
  handleClose: () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  handleCreateFollowUp: () => Promise<void>
  handleSkipFollowUp: () => Promise<void>
}

export function useTaskFormSubmit({
  buildingId,
  profileId,
  taskToEdit = null,
  sourceRequestId = null,
  title,
  description,
  category,
  priority,
  taskDate,
  taskTime,
  finalLocation,
  pestTargets,
  selectedApartments,
  photos,
  existingPhotos,
  removedPhotoIds,
  smartParsed,
  today,
  resetFormState,
  onClose,
  onCreated,
  setMessage,
}: UseTaskFormSubmitParams): UseTaskFormSubmitReturn {
  const [saving, setSaving] = useState(false)

  const isEditMode = !!taskToEdit

  const finalizeClose = async () => {
    resetFormState()
    onClose()

    if (onCreated) {
      await onCreated()
    }
  }

  const {
    showFollowUpPrompt,
    setShowFollowUpPrompt,
    followUpSourceTask,
    creatingFollowUp,
    handleCreateFollowUp,
    handleSkipFollowUp,
    promptFollowUp,
  } = useTaskFollowUpFlow({
    buildingId,
    profileId,
    finalizeClose,
    setMessage,
  })

  const handleClose = () => {
    if (creatingFollowUp || saving) return

    resetFormState()
    onClose()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage('')

    const validation = validateTaskForm({
      title,
      cleanedTitle: smartParsed.cleanedTitle,
      taskDate,
      today,
      buildingId,
      profileId,
      category,
      pestTargets,
      selectedApartments,
    })

    if (!validation.ok) {
      setMessage(validation.message)
      return
    }

    const finalTitle = validation.finalTitle
    const finalCategory = category as TaskCategory

    setSaving(true)

    try {
      if (isEditMode && taskToEdit) {
        const result = await updateTaskFromForm({
          taskId: taskToEdit.id,
          previousVisitType: taskToEdit.treatment_visit_type || null,
          removedPhotoIds,
          existingTaskPhotos: existingPhotos ?? taskToEdit.task_photos,
          buildingId,
          profileId,
          title: finalTitle,
          description,
          category: finalCategory,
          priority,
          taskDate,
          taskTime,
          finalLocation,
          pestTargets,
          selectedApartments,
          photos,
        })

        if (result.shouldPromptFollowUp && result.followUpSourceTask) {
          promptFollowUp(result.followUpSourceTask)
          setSaving(false)
          return
        }

        await finalizeClose()
        return
      }

      const result = await createTaskFromForm({
        buildingId,
        profileId,
        sourceRequestId,
        title: finalTitle,
        description,
        category: finalCategory,
        priority,
        taskDate,
        taskTime,
        finalLocation,
        pestTargets,
        selectedApartments,
        photos,
      })

      if (result.shouldPromptFollowUp && result.followUpSourceTask) {
        promptFollowUp(result.followUpSourceTask)
        setSaving(false)
        return
      }

      await finalizeClose()
    } catch (err) {
      console.error('Error guardando tarea:', err)
      setMessage(
        err instanceof Error
          ? err.message
          : isEditMode
            ? 'No se pudo actualizar la tarea.'
            : 'No se pudo guardar la tarea.'
      )
    } finally {
      setSaving(false)
    }
  }

  return {
    saving,
    showFollowUpPrompt,
    followUpSourceTask,
    creatingFollowUp,
    setShowFollowUpPrompt,
    handleClose,
    handleSubmit,
    handleCreateFollowUp,
    handleSkipFollowUp,
  }
}