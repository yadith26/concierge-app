'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createTaskFromForm, updateTaskFromForm } from '@/lib/tasks/taskFormActions'
import { validateTaskForm } from '@/lib/tasks/validateTaskForm'
import { useTaskFollowUpFlow } from '@/hooks/useTaskFollowUpFlow'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import {
  findDuplicatePestApartmentsForDate,
  findOpenPestCycleConflicts,
} from '@/lib/tasks/pestDuplicateGuard'
import { findExistingFollowUpDecisionItems } from '@/lib/tasks/followUpHelpers'
import type {
  EditableTask,
  PestTarget,
  TaskCategory,
  TaskPriority,
} from '@/lib/tasks/taskTypes'
import type {
  ExistingFollowUpDecisionItem,
  FollowUpSourceTask,
} from '@/lib/tasks/followUpHelpers'
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
  warrantyLoading: boolean
  warrantyAlerts: Array<{
    apartment_or_area: string
    pestTarget: PestTarget
    endDate: string
  }>
  photos: SelectedPhoto[]
  existingPhotos?: EditableTask['task_photos']
  removedPhotoIds: string[]
  smartParsed: SmartParsedInput
  today: string
  resetFormState: () => void
  onClose: () => void
  onCreated?: () => Promise<void> | void
  onResultMessage?: (message: string) => void
  setMessage: (message: string) => void
}

type UseTaskFormSubmitReturn = {
  saving: boolean
  showFollowUpPrompt: boolean
  showExistingDecision: boolean
  followUpSourceTask: FollowUpSourceTask | null
  existingFollowUps: ExistingFollowUpDecisionItem[]
  creatingFollowUp: boolean
  setShowFollowUpPrompt: (value: boolean) => void
  handleClose: () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  handleCreateFollowUp: () => Promise<void>
  handleKeepExistingFollowUps: () => Promise<void>
  handleReprogramExistingFollowUps: () => Promise<void>
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
  warrantyLoading,
  warrantyAlerts,
  photos,
  existingPhotos,
  removedPhotoIds,
  smartParsed,
  today,
  resetFormState,
  onClose,
  onCreated,
  onResultMessage,
  setMessage,
}: UseTaskFormSubmitParams): UseTaskFormSubmitReturn {
  const warrantyT = useTranslations('taskWarrantyAlerts')
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
    showExistingDecision,
    setShowFollowUpPrompt,
    followUpSourceTask,
    existingFollowUps,
    creatingFollowUp,
    handleCreateFollowUp,
    handleKeepExistingFollowUps,
    handleReprogramExistingFollowUps,
    handleSkipFollowUp,
    promptFollowUp,
    promptExistingFollowUps,
  } = useTaskFollowUpFlow({
    buildingId,
    profileId,
    finalizeClose,
    setMessage,
    onResultMessage,
  })

  const handleClose = () => {
    if (creatingFollowUp || saving) return

    resetFormState()
    onClose()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage('')

    if (category === 'pest' && warrantyLoading) {
      setMessage(warrantyT('checkingActiveWarranty'))
      return
    }

    const apartmentsWithActiveWarranty = new Set(
      warrantyAlerts.map((item) => normalizeApartmentKey(item.apartment_or_area))
    )

    const normalizedSelectedApartments =
      category === 'pest'
        ? selectedApartments.map((item) => {
            const apartmentKey = item.apartment_key
              ? normalizeApartmentKey(item.apartment_key)
              : normalizeApartmentKey(item.apartment_or_area)

            if (
              apartmentsWithActiveWarranty.has(apartmentKey) &&
              item.visit_type !== 'seguimiento'
            ) {
              return {
                ...item,
                visit_type: 'seguimiento' as const,
              }
            }

            return item
          })
        : selectedApartments

    let apartmentsToSave = normalizedSelectedApartments
    let existingManualFollowUpItems: ExistingFollowUpDecisionItem[] = []

    if (category === 'pest') {
      const followUpApartments = normalizedSelectedApartments.filter(
        (item) => item.visit_type === 'seguimiento'
      )

      if (followUpApartments.length > 0) {
        existingManualFollowUpItems = await findExistingFollowUpDecisionItems({
          buildingId,
          apartments: followUpApartments,
          pestTargets,
          suggestedDate: taskDate,
          suggestedTime: taskTime || null,
        })

        if (existingManualFollowUpItems.length > 0) {
          const existingApartmentKeys = new Set(
            existingManualFollowUpItems.map((item) =>
              normalizeApartmentKey(item.apartment_or_area)
            )
          )

          apartmentsToSave = normalizedSelectedApartments.filter((item) => {
            const apartmentKey = item.apartment_key
              ? normalizeApartmentKey(item.apartment_key)
              : normalizeApartmentKey(item.apartment_or_area)

            return !existingApartmentKeys.has(apartmentKey)
          })
        }
      }
    }

    if (category === 'pest' && apartmentsToSave.length === 0) {
      if (existingManualFollowUpItems.length > 0) {
        promptExistingFollowUps(existingManualFollowUpItems)
        return
      }
    }

    const validation = validateTaskForm({
      title,
      cleanedTitle: smartParsed.cleanedTitle,
      taskDate,
      today,
      buildingId,
      profileId,
      category,
      pestTargets,
      selectedApartments: apartmentsToSave,
    })

    if (!validation.ok) {
      setMessage(validation.message)
      return
    }

    if (category === 'pest') {
      const openCycleConflicts = await findOpenPestCycleConflicts({
        buildingId,
        selectedApartments: apartmentsToSave,
        pestTargets,
        excludeTaskId: taskToEdit?.id || null,
      })

      if (openCycleConflicts.length > 0) {
        setMessage(
          warrantyT('duplicateOpenCycle', {
            apartments: openCycleConflicts.join(', '),
          })
        )
        return
      }

      const duplicateApartments = await findDuplicatePestApartmentsForDate({
        buildingId,
        taskDate,
        selectedApartments: apartmentsToSave,
        excludeTaskId: taskToEdit?.id || null,
      })

      if (duplicateApartments.length > 0) {
        setMessage(
          warrantyT('duplicateScheduledForDate', {
            apartments: duplicateApartments.join(', '),
          })
        )
        return
      }
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
          selectedApartments: apartmentsToSave,
          photos,
        })

        if (result.shouldPromptFollowUp && result.followUpSourceTask) {
          promptFollowUp(
            result.followUpSourceTask,
            existingManualFollowUpItems
          )
          setSaving(false)
          return
        }

        if (existingManualFollowUpItems.length > 0) {
          promptExistingFollowUps(existingManualFollowUpItems)
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
        selectedApartments: apartmentsToSave,
        photos,
      })

      if (result.shouldPromptFollowUp && result.followUpSourceTask) {
        promptFollowUp(
          result.followUpSourceTask,
          existingManualFollowUpItems
        )
        setSaving(false)
        return
      }

      if (existingManualFollowUpItems.length > 0) {
        promptExistingFollowUps(existingManualFollowUpItems)
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
    showExistingDecision,
    followUpSourceTask,
    existingFollowUps,
    creatingFollowUp,
    setShowFollowUpPrompt,
    handleClose,
    handleSubmit,
    handleCreateFollowUp,
    handleKeepExistingFollowUps,
    handleReprogramExistingFollowUps,
    handleSkipFollowUp,
  }
}
