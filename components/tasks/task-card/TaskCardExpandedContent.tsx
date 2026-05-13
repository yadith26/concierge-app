'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  NotebookPen,
  Pencil,
  Shield,
  Tag,
  Trash2,
} from 'lucide-react'
import type { PestTarget, Task, TaskApartment } from '@/lib/tasks/taskTypes'
import {
  formatTaskDateLong,
  getCategoryKey,
  getPestTargetKey,
  getStatusKey,
  getVisitTypeKey,
} from '@/lib/tasks/taskLabels'
import { buildVisitSummary } from '@/lib/tasks/taskCardHelpers'
import TaskCardDetailRow from './TaskCardDetailRow'
import TaskCardStatusActionButton from './TaskCardStatusActionButton'

type TaskCardExpandedContentProps = {
  task: Task
  apartmentSummary: string | null
  hasPhotos: boolean
  pestTargets: PestTarget[]
  taskApartments: TaskApartment[]
  onSetPending?: () => void
  onSetInProgress?: () => void
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
  readOnly?: boolean
}

export default function TaskCardExpandedContent({
  task,
  apartmentSummary,
  hasPhotos,
  pestTargets,
  taskApartments,
  onSetPending,
  onSetInProgress,
  onComplete,
  onEdit,
  onDelete,
  readOnly = false,
}: TaskCardExpandedContentProps) {
  const t = useTranslations('taskCardExpanded')
  const labelT = useTranslations('taskLabels')
  const locale = useLocale()

  return (
    <div className="border-t border-[#EEF3F8] px-5 py-4">
      <div className="space-y-3">
        <TaskCardDetailRow
          icon={<NotebookPen className="h-4 w-4" />}
          label={t('fullTitle')}
          value={task.title?.trim() || t('noNote')}
        />

        <TaskCardDetailRow
          icon={<NotebookPen className="h-4 w-4" />}
          label={t('description')}
          value={task.description?.trim() || t('noNote')}
        />

        <div className="grid grid-cols-2 gap-3">
          <TaskCardDetailRow
            icon={<Tag className="h-4 w-4" />}
            label={t('category')}
            value={labelT(getCategoryKey(task.category))}
          />

          <TaskCardDetailRow
            icon={<MapPin className="h-4 w-4" />}
            label={t('location')}
            value={apartmentSummary || t('noLocation')}
          />
        </div>

        <TaskCardDetailRow
          icon={<CalendarDays className="h-4 w-4" />}
          label={t('dateAndTime')}
          value={
            task.task_time
              ? `${formatTaskDateLong(task.task_date, locale)} • ${task.task_time.slice(
                  0,
                  5
                )}`
              : formatTaskDateLong(task.task_date, locale)
          }
        />

        {task.created_at ? (
          <TaskCardDetailRow
            icon={<CalendarDays className="h-4 w-4" />}
            label={t('createdAt')}
            value={new Intl.DateTimeFormat(locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(task.created_at))}
          />
        ) : null}

        {task.completed_at ? (
          <TaskCardDetailRow
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={t('completedOn')}
            value={new Intl.DateTimeFormat(locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(task.completed_at))}
          />
        ) : null}

        {task.category === 'pest' &&
          (pestTargets.length > 0 ||
            task.treatment_visit_type ||
            taskApartments.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <TaskCardDetailRow
                icon={<Tag className="h-4 w-4" />}
                label={t('pests')}
                value={
                  pestTargets.length > 0
                    ? pestTargets.map((target) => labelT(getPestTargetKey(target))).join(', ')
                    : t('unspecified')
                }
              />

              <TaskCardDetailRow
                icon={<Shield className="h-4 w-4" />}
                label={t('visitType')}
                value={
                  taskApartments.length > 0
                    ? buildVisitSummary(
                        taskApartments,
                        labelT as unknown as (
                          key: string,
                          values?: Record<
                            string,
                            string | number | boolean | Date | null | undefined
                          >
                        ) => string
                      )
                    : labelT(getVisitTypeKey(task.treatment_visit_type ?? 'nuevo'))
                }
              />
            </div>
          )}

        {task.category === 'pest' && taskApartments.length > 0 && (
          <TaskCardDetailRow
            icon={<Building2 className="h-4 w-4" />}
            label={t('apartments')}
            value={taskApartments
              .map(
                (item) =>
                  `${item.apartment_or_area} (${labelT(
                    getVisitTypeKey(item.visit_type)
                  )})`
              )
              .join(', ')}
          />
        )}
      </div>

      {hasPhotos && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-[#5E6E8C]">
            {t('photos')}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {task.task_photos?.map((photo, index) => (
              <a
                key={photo.id || `${photo.image_url}-${index}`}
                href={photo.image_url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white"
              >
                <img
                  src={photo.image_url}
                  alt={`${t('photo')} ${index + 1}`}
                  className="h-24 w-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {!readOnly ? (
        <>
          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-[#5E6E8C]">
              {t('changeStatus')}
            </p>

            <div className="grid grid-cols-3 gap-2">
              <TaskCardStatusActionButton
                label={labelT(getStatusKey('pending'))}
                active={task.status === 'pending'}
                onClick={onSetPending ?? (() => {})}
              />

              <TaskCardStatusActionButton
                label={labelT(getStatusKey('in_progress'))}
                active={task.status === 'in_progress'}
                onClick={onSetInProgress ?? (() => {})}
              />

              <TaskCardStatusActionButton
                label={labelT(getStatusKey('completed'))}
                active={task.status === 'completed'}
                disabled={!onComplete}
                onClick={onComplete ?? (() => {})}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-2.5 text-sm font-semibold text-[#2F66C8] transition hover:bg-[#E4EEFF]"
            >
              <Pencil className="h-4 w-4" />
              {t('editTask')}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F6D6D9] bg-[#FFF4F5] px-4 py-2.5 text-sm font-semibold text-[#D64555] transition hover:bg-[#FFEDEF]"
            >
              <Trash2 className="h-4 w-4" />
              {t('deleteTask')}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
