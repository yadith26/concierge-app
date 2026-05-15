'use client'

import { useEffect, useRef, type ChangeEvent } from 'react'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import { getLocalDateInputValue } from '@/lib/dates/localDate'
import { useTaskWarranty } from '@/hooks/useTaskWarranty'
import { useTaskApartments } from '@/hooks/useTaskApartments'
import { useTaskSmartParsing } from '@/hooks/useTaskSmartParsing'
import { useTaskPhotos } from '@/hooks/useTaskPhotos'
import { useTaskFormState } from '@/hooks/useTaskFormState'
import { useTaskFormSubmit } from '@/hooks/useTaskFormSubmit'
import { useTaskCategoryReset } from '@/hooks/useTaskCategoryReset'
import type {
  EditableTask,
  PestTarget,
  TaskCategory,
  TaskDraft,
} from '@/lib/tasks/taskTypes'

type UseTaskFormModalParams = {
  open: boolean
  onClose: () => void
  buildingId: string
  profileId: string
  onCreated?: () => Promise<void> | void
  taskToEdit?: EditableTask | null
  initialValues?: TaskDraft | null
  initialPhotoFile?: File | null
  sourceRequestId?: string | null
  defaultDate?: string
  defaultCategory?: TaskCategory | ''
  onResultMessage?: (message: string) => void
}

function getLocationFieldKeys({
  open,
  taskToEdit,
  sourceRequestId,
  initialValues,
}: Pick<
  UseTaskFormModalParams,
  'open' | 'taskToEdit' | 'sourceRequestId' | 'initialValues'
>) {
  const instanceKey = taskToEdit?.id || sourceRequestId || 'new'
  const singleLocationSeed =
    initialValues?.apartment_or_area || taskToEdit?.apartment_or_area || 'single'
  const multiLocationSeed =
    initialValues?.task_apartments?.[0]?.apartment_or_area ||
    initialValues?.apartment_or_area ||
    taskToEdit?.apartment_or_area ||
    'multi'

  return {
    singleLocationFieldKey: `${open}-${instanceKey}-${singleLocationSeed}`,
    multiLocationFieldKey: `${open}-${instanceKey}-${multiLocationSeed}`,
  }
}

export function useTaskFormModal({
  open,
  onClose,
  buildingId,
  profileId,
  onCreated,
  taskToEdit = null,
  initialValues = null,
  initialPhotoFile = null,
  sourceRequestId = null,
  defaultDate,
  defaultCategory = '',
  onResultMessage,
}: UseTaskFormModalParams) {
  const today = getLocalDateInputValue()
  const injectedPhotoRef = useRef<File | null>(null)

  const { singleLocationFieldKey, multiLocationFieldKey } = getLocationFieldKeys({
    open,
    taskToEdit,
    sourceRequestId,
    initialValues,
  })

  const {
    selectedApartments,
    setSelectedApartments,
    draftApartmentValue,
    setDraftApartmentValue,
    draftApartmentVisitType,
    setDraftApartmentVisitType,
    sanitizeApartmentValue,
    resetApartments,
    handleAddApartment,
    handleRemoveApartment,
  } = useTaskApartments()

  const {
    photos,
    existingPhotos,
    removedPhotoIds,
    hydrateExistingPhotos,
    resetAllPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
  } = useTaskPhotos()

  useEffect(() => {
    if (!open) {
      injectedPhotoRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open || taskToEdit || !initialPhotoFile) return
    if (injectedPhotoRef.current === initialPhotoFile) return

    injectedPhotoRef.current = initialPhotoFile

    const fakeEvent = {
      target: {
        files: [initialPhotoFile],
      },
    } as unknown as ChangeEvent<HTMLInputElement>

    handlePhotosSelected(fakeEvent)
  }, [open, taskToEdit, initialPhotoFile, handlePhotosSelected])

  const {
    title,
    setTitle,
    description,
    setDescription,
    locationValue,
    setLocationValue,
    category,
    setCategory,
    priority,
    setPriority,
    taskDate,
    setTaskDate,
    taskTime,
    setTaskTime,
    pestTargets,
    setPestTargets,
    message,
    setMessage,
    isEditMode,
    finalLocation,
    resetFormState,
  } = useTaskFormState({
    open,
    taskToEdit,
    initialValues,
    preserveDraftPhotos: Boolean(initialPhotoFile) && !taskToEdit,
    defaultDate,
    defaultCategory,
    onResetApartments: resetApartments,
    onSetSelectedApartments: setSelectedApartments,
    onSetDraftApartmentValue: setDraftApartmentValue,
    onSetDraftApartmentVisitType: setDraftApartmentVisitType,
    onHydrateExistingPhotos: hydrateExistingPhotos,
    onResetAllPhotos: resetAllPhotos,
  })

  const { warrantyLoading, warrantyAlerts } = useTaskWarranty({
    open,
    buildingId,
    category,
    selectedApartments,
    pestTargets,
  })

  useEffect(() => {
    if (!open || category !== 'pest' || warrantyAlerts.length === 0) return

    const apartmentsWithActiveWarranty = new Set(
      warrantyAlerts.map((item) =>
        normalizeApartmentKey(item.apartment_or_area)
      )
    )

    setSelectedApartments((prev) => {
      let changed = false

      const next = prev.map((item) => {
        const apartmentKey = item.apartment_key
          ? normalizeApartmentKey(item.apartment_key)
          : normalizeApartmentKey(item.apartment_or_area)

        if (
          apartmentsWithActiveWarranty.has(apartmentKey) &&
          item.visit_type !== 'seguimiento'
        ) {
          changed = true
          return {
            ...item,
            visit_type: 'seguimiento' as const,
          }
        }

        return item
      })

      return changed ? next : prev
    })
  }, [open, category, warrantyAlerts, setSelectedApartments])

  const { smartParsed, tryApplySmartParsing } = useTaskSmartParsing({
    title,
    category,
    defaultCategory,
    setCategory,
    setPriority,
    setTaskDate,
    setTaskTime,
    setLocationValue,
    setDraftApartmentVisitType,
    setPestTargets,
    setSelectedApartments,
  })

  useEffect(() => {
    if (!open || taskToEdit) return

    if (!locationValue.trim() && smartParsed.detectedLocation) {
      setLocationValue(smartParsed.detectedLocation)
    }
  }, [
    open,
    taskToEdit,
    locationValue,
    smartParsed.detectedLocation,
    setLocationValue,
  ])

  useTaskCategoryReset({
    category,
    setPestTargets,
    resetApartments,
    setDraftApartmentValue,
    setDraftApartmentVisitType,
  })

  const {
    saving,
    showFollowUpPrompt,
    showExistingDecision,
    existingFollowUps,
    creatingFollowUp,
    handleClose,
    handleSubmit,
    handleCreateFollowUp,
    handleKeepExistingFollowUps,
    handleReprogramExistingFollowUps,
    handleSkipFollowUp,
  } = useTaskFormSubmit({
    buildingId,
    profileId,
    taskToEdit,
    sourceRequestId,
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
    existingPhotos: taskToEdit?.task_photos,
    removedPhotoIds,
    smartParsed,
    today,
    resetFormState,
    onClose,
    onCreated,
    onResultMessage,
    setMessage,
    warrantyLoading,
    warrantyAlerts,
  })

  const togglePestTarget = (target: PestTarget) => {
    setPestTargets((prev) =>
      prev.includes(target)
        ? prev.filter((item) => item !== target)
        : [...prev, target]
    )
  }

  return {
    today,
    singleLocationFieldKey,
    multiLocationFieldKey,
    draftApartmentValue,
    setDraftApartmentValue,
    draftApartmentVisitType,
    setDraftApartmentVisitType,
    sanitizeApartmentValue,
    handleAddApartment,
    handleRemoveApartment,
    photos,
    existingPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
    title,
    setTitle,
    description,
    setDescription,
    locationValue,
    setLocationValue,
    category,
    setCategory,
    priority,
    setPriority,
    taskDate,
    setTaskDate,
    taskTime,
    setTaskTime,
    pestTargets,
    message,
    setMessage,
    isEditMode,
    warrantyLoading,
    warrantyAlerts,
    smartParsed,
    tryApplySmartParsing,
    saving,
    showFollowUpPrompt,
    showExistingDecision,
    existingFollowUps,
    creatingFollowUp,
    handleClose,
    handleSubmit,
    handleCreateFollowUp,
    handleKeepExistingFollowUps,
    handleReprogramExistingFollowUps,
    handleSkipFollowUp,
    selectedApartments,
    togglePestTarget,
  }
}
