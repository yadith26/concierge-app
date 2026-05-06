'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, Loader2, MapPin, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import StyledDropdown from '@/components/ui/StyledDropdown'
import {
  createManagerTask,
  updateManagerTask,
  type ManagerTask,
} from '@/lib/manager/managerTaskService'
import {
  detectManagerTaskCategory,
  managerTaskCategoryOptions,
  normalizeManagerTaskCategory,
  type ManagerTaskCategory,
} from '@/lib/manager/managerTaskCategories'
import { parseSmartTaskInput } from '@/lib/tasks/taskSmartParser'
import type { TaskDraft, TaskPriority } from '@/lib/tasks/taskTypes'

type ManagerTaskBuildingOption = {
  id: string
  name: string
}

type ManagerTaskFormModalProps = {
  open: boolean
  buildingId?: string | null
  managerId: string
  conciergeId?: string | null
  sourceMessageId?: string | null
  initialValues?: TaskDraft | null
  taskToEdit?: ManagerTask | null
  buildingOptions?: ManagerTaskBuildingOption[]
  onClose: () => void
  onCreated?: () => void | Promise<void>
}

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'low', label: 'Baja' },
]

const noBuildingValue = '__no_building__'

function todayDateInput() {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ManagerTaskFormModal({
  open,
  managerId,
  conciergeId = null,
  sourceMessageId = null,
  initialValues = null,
  taskToEdit = null,
  buildingOptions = [],
  onClose,
  onCreated,
}: ManagerTaskFormModalProps) {
  const locale = useLocale()
  const today = useMemo(() => todayDateInput(), [])
  const isEditing = !!taskToEdit

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ManagerTaskCategory | ''>('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [taskDate, setTaskDate] = useState(today)
  const [taskTime, setTaskTime] = useState('')
  const [apartmentOrArea, setApartmentOrArea] = useState('')
  const [categoryEditedManually, setCategoryEditedManually] = useState(false)
  const [priorityEditedManually, setPriorityEditedManually] = useState(false)
  const [dateEditedManually, setDateEditedManually] = useState(false)
  const [timeEditedManually, setTimeEditedManually] = useState(false)
  const [locationEditedManually, setLocationEditedManually] = useState(false)
  const [buildingEditedManually, setBuildingEditedManually] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const buildingDropdownValue = selectedBuildingId || noBuildingValue
  const buildingDropdownOptions = [
    {
      value: noBuildingValue,
      label: 'Tarea administrativa general',
    },
    ...buildingOptions.map((building) => ({
      value: building.id,
      label: building.name,
    })),
  ]

  useEffect(() => {
    if (!open) return

    setTitle(taskToEdit?.title || initialValues?.title || '')
    setDescription(taskToEdit?.description || initialValues?.description || '')
    setCategory(
      normalizeManagerTaskCategory(
        taskToEdit?.category || initialValues?.category
      ) || ''
    )
    setPriority(taskToEdit?.priority || initialValues?.priority || 'medium')
    setSelectedBuildingId(taskToEdit?.building_id || '')
    setTaskDate(
      taskToEdit?.task_date ||
        (initialValues?.task_date && initialValues.task_date >= today
          ? initialValues.task_date
          : today)
    )
    setTaskTime(taskToEdit?.task_time || initialValues?.task_time || '')
    setApartmentOrArea(
      taskToEdit?.apartment_or_area || initialValues?.apartment_or_area || ''
    )
    setCategoryEditedManually(false)
    setPriorityEditedManually(false)
    setDateEditedManually(false)
    setTimeEditedManually(false)
    setLocationEditedManually(false)
    setBuildingEditedManually(false)
    setError('')
  }, [initialValues, open, taskToEdit, today])

  function findDetectedBuildingId(value: string) {
    const normalizedValue = normalizeForSmartMatch(value)

    if (!normalizedValue) return ''

    return (
      buildingOptions.find((building) => {
        const normalizedName = normalizeForSmartMatch(building.name)
        return normalizedName && normalizedValue.includes(normalizedName)
      })?.id || ''
    )
  }

  function handleTitleChange(value: string) {
    setTitle(value)

    if (isEditing) return

    const parsed = parseSmartTaskInput(value, locale)

    if (!categoryEditedManually) {
      setCategory(detectManagerTaskCategory(value) || '')
    }

    if (parsed.detectedPriority && !priorityEditedManually) {
      setPriority(parsed.detectedPriority)
    }

    if (parsed.detectedDate && !dateEditedManually) {
      setTaskDate(parsed.detectedDate >= today ? parsed.detectedDate : today)
    }

    if (parsed.detectedTime && !timeEditedManually) {
      setTaskTime(parsed.detectedTime)
    }

    if (parsed.detectedLocation && !locationEditedManually) {
      setApartmentOrArea(parsed.detectedLocation)
    }

    if (!buildingEditedManually) {
      const detectedBuildingId = findDetectedBuildingId(value)
      if (detectedBuildingId) {
        setSelectedBuildingId(detectedBuildingId)
      }
    }
  }

  if (!open) return null

  async function handleSubmit() {
    if (!managerId) {
      setError('No se pudo identificar el manager.')
      return
    }

    if (!title.trim()) {
      setError('Escribe un titulo para la tarea.')
      return
    }

    if (!category) {
      setError('Selecciona una categoria para la tarea.')
      return
    }

    if (!isEditing && taskDate < today) {
      setError('La fecha no puede ser anterior a hoy.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        buildingId: selectedBuildingId || null,
        managerId,
        conciergeId: taskToEdit?.concierge_id || conciergeId,
        sourceMessageId: taskToEdit?.source_message_id || sourceMessageId,
        title,
        description,
        category,
        priority,
        taskDate,
        taskTime,
        apartmentOrArea,
      }

      if (taskToEdit) {
        await updateManagerTask({
          taskId: taskToEdit.id,
          payload,
        })
      } else {
        await createManagerTask(payload)
      }

      await onCreated?.()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEditing
            ? 'No se pudo actualizar la tarea del manager.'
            : 'No se pudo crear la tarea del manager.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF3F8] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C9AB3]">
              Tarea administrativa
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#142952]">
              {isEditing
                ? 'Editar tarea administrativa'
                : 'Nueva tarea administrativa'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] p-2 text-[#6E7F9D]"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="rounded-2xl bg-[#FFF4F4] px-4 py-3 text-sm font-semibold text-[#C53030]">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
              Titulo
            </span>
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none transition focus:border-[#2F66C8]"
              placeholder="Ej: Llamar al proveedor mañana 10am"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <StyledDropdown
              label="Categoria"
              ariaLabel="Seleccionar categoria"
              value={category}
              options={managerTaskCategoryOptions}
              onChange={(value) => {
                setCategory(value as ManagerTaskCategory)
                setCategoryEditedManually(true)
              }}
              placeholder="Seleccionar categoria"
              zIndexClassName="z-30"
            />

            <StyledDropdown
              label="Prioridad"
              ariaLabel="Seleccionar prioridad"
              value={priority}
              options={priorityOptions}
              onChange={(value) => {
                setPriority(value as TaskPriority)
                setPriorityEditedManually(true)
              }}
              zIndexClassName="z-30"
            />
          </div>

          <StyledDropdown
            label="Seleccionar alcance"
            ariaLabel="Seleccionar si la tarea es general o de un edificio"
            value={buildingDropdownValue}
            options={buildingDropdownOptions}
            onChange={(value) => {
              setSelectedBuildingId(value === noBuildingValue ? '' : value)
              setBuildingEditedManually(true)
            }}
            placeholder="Escoger alcance"
            zIndexClassName="z-30"
          />

          <p className="-mt-2 text-xs font-medium leading-5 text-[#7B8BA8]">
            Usa tarea administrativa general si es propia del administrador y no
            pertenece a un edificio especifico.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5E6E8C]">
                <CalendarDays size={16} />
                Fecha
              </span>
              <input
                type="date"
                value={taskDate}
                min={isEditing ? undefined : today}
                onChange={(event) => {
                  setTaskDate(event.target.value)
                  setDateEditedManually(true)
                }}
                className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none transition focus:border-[#2F66C8]"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5E6E8C]">
                <Clock size={16} />
                Hora
              </span>
              <input
                type="time"
                value={taskTime}
                onChange={(event) => {
                  setTaskTime(event.target.value)
                  setTimeEditedManually(true)
                }}
                className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none transition focus:border-[#2F66C8]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5E6E8C]">
              <MapPin size={16} />
              Apartamento / area relacionada
            </span>
            <input
              value={apartmentOrArea}
              onChange={(event) => {
                setApartmentOrArea(event.target.value)
                setLocationEditedManually(true)
              }}
              className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none transition focus:border-[#2F66C8]"
              placeholder="Opcional"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
              Nota
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none transition focus:border-[#2F66C8]"
              placeholder="Detalles adicionales..."
            />
          </label>
        </div>

        <div className="border-t border-[#EEF3F8] px-5 py-4">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="flex w-full items-center justify-center gap-3 rounded-[26px] bg-[#2F66C8] px-5 py-4 text-base font-bold text-white shadow-[0_14px_28px_rgba(47,102,200,0.24)] transition hover:bg-[#2859B2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {isEditing ? 'Guardar cambios' : 'Crear tarea administrativa'}
          </button>
        </div>
      </div>
    </div>
  )
}

function normalizeForSmartMatch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
