'use client'

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type {
  EditableTask,
  ExistingTaskPhoto,
  PestTarget,
  TaskCategory,
  TaskDraft,
  TaskPriority,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type UseTaskFormStateParams = {
  open: boolean
  taskToEdit?: EditableTask | null
  initialValues?: TaskDraft | null
  preserveDraftPhotos?: boolean
  defaultDate?: string
  defaultCategory?: TaskCategory | ''
  onResetApartments: (items?: TaskApartmentInput[]) => void
  onSetSelectedApartments: Dispatch<SetStateAction<TaskApartmentInput[]>>
  onSetDraftApartmentValue: Dispatch<SetStateAction<string>>
  onSetDraftApartmentVisitType: Dispatch<
    SetStateAction<TreatmentVisitType | ''>
  >
  onHydrateExistingPhotos: (items: ExistingTaskPhoto[]) => void
  onResetAllPhotos: () => void
}

type UseTaskFormStateReturn = {
  title: string
  setTitle: Dispatch<SetStateAction<string>>
  description: string
  setDescription: Dispatch<SetStateAction<string>>
  locationValue: string
  setLocationValue: Dispatch<SetStateAction<string>>
  category: TaskCategory | ''
  setCategory: Dispatch<SetStateAction<TaskCategory | ''>>
  priority: TaskPriority
  setPriority: Dispatch<SetStateAction<TaskPriority>>
  taskDate: string
  setTaskDate: Dispatch<SetStateAction<string>>
  taskTime: string
  setTaskTime: Dispatch<SetStateAction<string>>
  pestTargets: PestTarget[]
  setPestTargets: Dispatch<SetStateAction<PestTarget[]>>
  message: string
  setMessage: Dispatch<SetStateAction<string>>
  isEditMode: boolean
  finalLocation: string
  resetFormState: () => void
  populateFormState: () => void
}

export function useTaskFormState({
  open,
  taskToEdit = null,
  initialValues = null,
  preserveDraftPhotos = false,
  defaultDate,
  defaultCategory = '',
  onResetApartments,
  onSetSelectedApartments,
  onSetDraftApartmentValue,
  onSetDraftApartmentVisitType,
  onHydrateExistingPhotos,
  onResetAllPhotos,
}: UseTaskFormStateParams): UseTaskFormStateReturn {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationValue, setLocationValue] = useState('')
  const [category, setCategory] = useState<TaskCategory | ''>(defaultCategory)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [taskDate, setTaskDate] = useState(defaultDate || '')
  const [taskTime, setTaskTime] = useState('')
  const [pestTargets, setPestTargets] = useState<PestTarget[]>([])
  const [message, setMessage] = useState('')

  const isEditMode = !!taskToEdit
  const finalLocation = useMemo(() => locationValue.trim(), [locationValue])

  const resetFeedbackState = () => {
    setMessage('')
  }

  const resetFormState = () => {
    setTitle('')
    setDescription('')
    setLocationValue('')
    setCategory(initialValues?.category || defaultCategory)
    setPriority(initialValues?.priority || 'medium')
    setTaskDate(initialValues?.task_date || defaultDate || '')
    setTaskTime(initialValues?.task_time || '')
    setPestTargets(initialValues?.pest_targets || [])
    resetFeedbackState()

    onResetAllPhotos()
    onResetApartments(initialValues?.task_apartments || [])
    onSetDraftApartmentValue('')
    onSetDraftApartmentVisitType('')
  }

  const populateFormState = () => {
    if (!taskToEdit) {
      setTitle(initialValues?.title || '')
      setDescription(initialValues?.description || '')
      setLocationValue(initialValues?.apartment_or_area || '')
      setCategory(initialValues?.category || defaultCategory)
      setPriority(initialValues?.priority || 'medium')
      setTaskDate(initialValues?.task_date || defaultDate || '')
      setTaskTime(initialValues?.task_time || '')
      setPestTargets(initialValues?.pest_targets || [])
      resetFeedbackState()

      if (!preserveDraftPhotos) {
        onResetAllPhotos()
      }

      if (initialValues?.task_apartments?.length) {
        onSetSelectedApartments(
          initialValues.task_apartments.map((item) => ({
            apartment_or_area: item.apartment_or_area,
            apartment_key: item.apartment_key ?? null,
            visit_type: item.visit_type,
          }))
        )
      } else {
        onResetApartments([])
      }

      onSetDraftApartmentValue('')
      onSetDraftApartmentVisitType('')
      return
    }

    setTitle(taskToEdit.title || '')
    setDescription(taskToEdit.description || '')
    setLocationValue(taskToEdit.apartment_or_area || '')
    setCategory(taskToEdit.category || defaultCategory)
    setPriority(taskToEdit.priority || 'medium')
    setTaskDate(taskToEdit.task_date || '')
    setTaskTime(taskToEdit.task_time || '')
    setPestTargets(taskToEdit.pest_targets || [])
    resetFeedbackState()

    onHydrateExistingPhotos(taskToEdit.task_photos || [])

    if (taskToEdit.category === 'pest' && taskToEdit.task_apartments?.length) {
      onSetSelectedApartments(
        taskToEdit.task_apartments.map((item) => ({
          apartment_or_area: item.apartment_or_area,
          apartment_key: item.apartment_key ?? null,
          visit_type: item.visit_type,
        }))
      )
      onSetDraftApartmentValue('')
      onSetDraftApartmentVisitType('')
      return
    }

    if (taskToEdit.category === 'pest' && taskToEdit.apartment_or_area) {
      onSetSelectedApartments([
        {
          apartment_or_area: taskToEdit.apartment_or_area,
          apartment_key: taskToEdit.apartment_key ?? null,
          visit_type: taskToEdit.treatment_visit_type || 'nuevo',
        },
      ])
      onSetDraftApartmentValue('')
      onSetDraftApartmentVisitType('')
      return
    }

    onResetApartments([])
    onSetDraftApartmentValue('')
    onSetDraftApartmentVisitType('')
  }

  useEffect(() => {
    if (!open) return
    const timeoutId = window.setTimeout(() => {
      populateFormState()
    }, 0)

    return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskToEdit, initialValues, defaultDate, defaultCategory, preserveDraftPhotos])

  return {
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
    populateFormState,
  }
}
