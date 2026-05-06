'use client'

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react'
import useTaskCardSwipe from '@/hooks/useTaskCardSwipe'
import type { ManagerTask } from '@/lib/manager/managerTaskService'
import { getManagerTaskCategoryLabel } from '@/lib/manager/managerTaskCategories'
import type { TaskStatus } from '@/lib/tasks/taskTypes'

type ManagerPrivateTaskCardProps = {
  task: ManagerTask
  buildingName: string
  expanded: boolean
  onToggleExpand: () => void
  onStatusChange: (status: TaskStatus) => void
  onEdit?: () => void
  onDelete: () => void
}

const priorityBadgeStyles: Record<string, string> = {
  high: 'bg-[#FDE2E4] text-[#C53030]',
  medium: 'bg-[#FFF4D6] text-[#9A6700]',
  low: 'bg-[#EEF2F8] text-[#60739A]',
}

function getScopeLabel(task: ManagerTask, buildingName: string) {
  return task.building_id ? buildingName || 'Edificio' : 'General'
}

function getStatusStyles(status?: string) {
  if (status === 'completed') {
    return 'bg-[#EAF8EF] text-[#177B52]'
  }

  if (status === 'in_progress') {
    return 'bg-[#EEF4FF] text-[#2F66C8]'
  }

  return 'bg-[#FFF4F4] text-[#C53030]'
}

function getLeftBarColor(priority?: string) {
  if (priority === 'high') return 'bg-[#F0B9C0]'
  if (priority === 'medium') return 'bg-[#E7C95F]'
  return 'bg-[#D9E1EE]'
}

function getPriorityLabel(priority?: string) {
  if (priority === 'high') return 'Urgente'
  if (priority === 'medium') return 'Media'
  return 'Baja'
}

function formatTaskDate(date?: string) {
  if (!date) return ''

  const safeDate = new Date(`${date}T12:00:00`)

  return safeDate.toLocaleDateString('es-CA', {
    day: 'numeric',
    month: 'short',
  })
}

export default function ManagerPrivateTaskCard({
  task,
  buildingName,
  expanded,
  onToggleExpand,
  onStatusChange,
  onEdit,
  onDelete,
}: ManagerPrivateTaskCardProps) {
  const {
    rootRef,
    translateX,
    dragging,
    swipeState,
    touchMovedRef,
    closeSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
  } = useTaskCardSwipe()

  const completed = task.status === 'completed'
  const inProgress = task.status === 'in_progress'
  const categoryLabel = getManagerTaskCategoryLabel(task.category)
  const priorityClass =
    priorityBadgeStyles[task.priority] || priorityBadgeStyles.low
  const scopeLabel = getScopeLabel(task, buildingName)

  const handleCardClick = () => {
    if (touchMovedRef.current) return

    if (swipeState !== 'closed') {
      closeSwipe()
      return
    }

    onToggleExpand()
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="absolute inset-0 overflow-hidden rounded-[28px]">
        <div
          className="absolute inset-0 transition-colors duration-200"
          style={{
            background:
              translateX > 0
                ? `rgba(121,196,124, ${Math.min(translateX / 120, 1)})`
                : translateX < 0
                  ? `rgba(230,91,103, ${Math.min(
                      Math.abs(translateX) / 120,
                      1
                    )})`
                  : 'transparent',
          }}
        />

        <div className="absolute inset-y-0 left-0 flex items-stretch">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onStatusChange('completed')
              closeSwipe()
            }}
            className="flex w-[96px] items-center justify-center gap-2 text-white"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-semibold">Completar</span>
          </button>
        </div>

        <div className="absolute inset-y-0 right-0 flex items-stretch">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
              closeSwipe()
            }}
            className="flex w-[96px] items-center justify-center gap-2 text-white"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Eliminar</span>
          </button>
        </div>
      </div>

      <article
        className="relative rounded-[28px] border border-[#E7EDF5] bg-white p-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 220ms ease',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <button
          type="button"
          onClick={handleCardClick}
          className="w-full text-left"
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-[82px] w-[7px] shrink-0 rounded-full ${getLeftBarColor(
                task.priority
              )}`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#5B6E95]">
                      {categoryLabel}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${priorityClass}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>

                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#F3F6FB] px-3 py-1 text-xs font-bold text-[#6E7F9D]">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{scopeLabel}</span>
                    </span>
                  </div>

                  <h3
                    className={`mt-4 text-[17px] font-bold leading-tight ${
                      completed ? 'text-[#8C9AB3] line-through' : 'text-[#142952]'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.apartment_or_area ? (
                    <p className="mt-3 text-[16px] text-[#6E7F9D]">
                      {task.apartment_or_area}
                    </p>
                  ) : null}

                  {task.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-8 text-[#7A89A8]">
                      {task.description}
                    </p>
                  ) : null}

                  {!expanded ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#7B8BA8]">
                      {task.task_date ? (
                        <span>{formatTaskDate(task.task_date)}</span>
                      ) : null}
                      {task.priority ? (
                        <span>
                          {' - '}
                          {task.priority === 'high'
                            ? 'Alta'
                            : task.priority === 'medium'
                              ? 'Media'
                              : 'Baja'}
                        </span>
                      ) : null}
                      {task.description ? (
                        <span className="rounded-full bg-[#EEF2F8] px-3 py-1 font-semibold text-[#6A7691]">
                          Nota
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-start gap-2 pt-1">
                  <span
                    className={`rounded-full px-3 py-[6px] text-xs font-semibold leading-none ${getStatusStyles(task.status)}`}
                  >
                    {completed
                      ? 'Completada'
                      : inProgress
                        ? 'En progreso'
                        : 'Pendiente'}
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F2] bg-white text-[#7B8BA8]">
                    {expanded ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>

        {expanded ? (
          <div className="mt-5 border-t border-[#EEF2F7] pt-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-[#F8FAFD] px-4 py-4">
                <div className="flex items-center gap-2 text-[#8C9AB3]">
                  <Tag size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.06em]">
                    Categoria
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-semibold text-[#2B3B63]">
                  {categoryLabel}
                </p>
              </div>

              <div className="rounded-[22px] bg-[#F8FAFD] px-4 py-4">
                <div className="flex items-center gap-2 text-[#8C9AB3]">
                  <MapPin size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.06em]">
                    Ubicacion
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-semibold text-[#2B3B63]">
                  {buildingName || 'General'}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[22px] bg-[#F8FAFD] px-4 py-4">
              <div className="flex items-center gap-2 text-[#8C9AB3]">
                <CalendarDays size={16} />
                <span className="text-xs font-semibold uppercase tracking-[0.06em]">
                  Fecha y hora
                </span>
              </div>
              <p className="mt-2 text-[15px] font-semibold text-[#2B3B63]">
                {formatTaskDate(task.task_date)}
                {task.task_time ? ` - ${task.task_time.slice(0, 5)}` : ''}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-[15px] font-bold text-[#5E6E8C]">
                Cambiar estado
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onStatusChange('pending')}
                  className={`rounded-full px-2 py-3 text-xs font-bold ${
                    task.status === 'pending'
                      ? 'bg-[#EAF0FF] text-[#4D63E4]'
                      : 'border border-[#E3EAF3] bg-white text-[#6E7F9D]'
                  }`}
                >
                  Pendiente
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange('in_progress')}
                  className={`rounded-full px-2 py-3 text-xs font-bold ${
                    task.status === 'in_progress'
                      ? 'bg-[#EAF0FF] text-[#4D63E4]'
                      : 'border border-[#E3EAF3] bg-white text-[#6E7F9D]'
                  }`}
                >
                  En progreso
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange('completed')}
                  className={`rounded-full px-2 py-3 text-xs font-bold ${
                    task.status === 'completed'
                      ? 'bg-[#EAF8EF] text-[#177B52]'
                      : 'border border-[#E3EAF3] bg-white text-[#6E7F9D]'
                  }`}
                >
                  Completada
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-4 text-[15px] font-bold text-[#2F66C8]"
                >
                  <Pencil size={18} className="shrink-0" />
                  <span className="truncate">Editar tarea</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={onDelete}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-[#FFF4F4] px-3 py-4 text-[15px] font-bold text-[#C53030]"
              >
                <Trash2 size={18} className="shrink-0" />
                <span className="truncate">Eliminar tarea</span>
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  )
}
