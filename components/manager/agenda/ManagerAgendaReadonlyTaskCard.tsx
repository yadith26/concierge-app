'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { Task } from '@/lib/tasks/taskTypes'
import { getTaskCardViewModel } from '@/lib/tasks/taskCardView'
import {
  formatTaskDate,
  getPriorityKey,
  getStatusKey,
  getVisitTypeKey,
} from '@/lib/tasks/taskLabels'
import TaskCardHeader from '@/components/tasks/task-card/TaskCardHeader'
import TaskCardMeta from '@/components/tasks/task-card/TaskCardMeta'
import TaskCardExpandedContent from '@/components/tasks/task-card/TaskCardExpandedContent'
import type { TFunction } from '@/components/manager/agenda/managerAgendaTypes'

type ManagerAgendaReadonlyTaskCardProps = {
  task: Task
  expanded: boolean
  onToggleExpand: () => void
}

export default function ManagerAgendaReadonlyTaskCard({
  task,
  expanded,
  onToggleExpand,
}: ManagerAgendaReadonlyTaskCardProps) {
  const labelT = useTranslations('taskLabels')
  const globalT = useTranslations()
  const locale = useLocale()

  const {
    isUrgent,
    isFromManagerEvent,
    hasPhotos,
    hasNote,
    pestTargets,
    taskApartments,
    apartmentSummary,
    apartmentCount,
    initialCount,
    followUpCount,
    preventiveCount,
    priorityBar,
    badgeClass,
    categoryMeta,
    soonLabel,
  } = getTaskCardViewModel(task, globalT as unknown as TFunction)

  const CategoryIcon = categoryMeta.icon

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <button
        type="button"
        onClick={onToggleExpand}
        className="block w-full text-left"
      >
        <div className="flex items-start gap-4 px-4 py-4">
          <div className="flex shrink-0 items-start gap-3">
            <div
              className={`mt-1 h-14 w-1 shrink-0 rounded-full ${priorityBar}`}
            />

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${categoryMeta.iconWrap}`}
            >
              <CategoryIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <TaskCardHeader
              title={task.title}
              categoryLabel={categoryMeta.label}
              CategoryIcon={CategoryIcon}
              categoryChip={categoryMeta.chip}
              isUrgent={isUrgent}
              isFromManagerEvent={isFromManagerEvent}
              soonLabel={soonLabel}
              statusLabel={labelT(getStatusKey(task.status))}
              badgeClass={badgeClass}
              expanded={expanded}
              apartmentSummary={apartmentSummary}
              description={task.description}
            />

            <div className="mt-3">
              <TaskCardMeta
                dateLabel={formatTaskDate(task.task_date, locale)}
                priorityLabel={labelT(getPriorityKey(task.priority))}
                taskTime={task.task_time}
                hasPhotos={hasPhotos}
                photoCount={task.task_photos?.length || 0}
                hasNote={hasNote}
                isPest={task.category === 'pest'}
                pestCount={pestTargets.length}
                apartmentCount={apartmentCount}
                showVisitTypeChip={
                  task.category === 'pest' &&
                  taskApartments.length === 0 &&
                  !!task.treatment_visit_type
                }
                visitTypeLabel={
                  task.treatment_visit_type
                    ? labelT(getVisitTypeKey(task.treatment_visit_type))
                    : null
                }
                initialCount={initialCount}
                followUpCount={followUpCount}
                preventiveCount={preventiveCount}
              />
            </div>
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <TaskCardExpandedContent
            task={task}
            apartmentSummary={apartmentSummary}
            hasPhotos={hasPhotos}
            pestTargets={pestTargets}
            taskApartments={taskApartments}
            readOnly
          />
        </div>
      </div>
    </div>
  )
}
