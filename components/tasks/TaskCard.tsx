'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Check, Trash2 } from 'lucide-react'
import type { Task } from '@/lib/tasks/taskTypes'
import {
  formatTaskDate,
  getPriorityKey,
  getStatusKey,
  getVisitTypeKey,
} from '@/lib/tasks/taskLabels'
import useTaskCardSwipe from '@/hooks/useTaskCardSwipe'
import { getTaskCardViewModel } from '@/lib/tasks/taskCardView'
import TaskCardHeader from './task-card/TaskCardHeader'
import TaskCardMeta from './task-card/TaskCardMeta'
import TaskCardExpandedContent from '@/components/tasks/task-card/TaskCardExpandedContent'

type TFunction = (key: string, values?: Record<string, unknown>) => string

type TaskCardProps = {
  task: Task
  expanded: boolean
  embedded?: boolean
  showDivider?: boolean
  onToggleExpand: () => void
  onComplete: () => void
  onSwipeComplete?: () => void
  onSetInProgress: () => void
  onSetPending: () => void
  onDelete: () => void
  onEdit: () => void
}

export default function TaskCard({
  task,
  expanded,
  embedded = false,
  showDivider = false,
  onToggleExpand,
  onComplete,
  onSwipeComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const t = useTranslations('taskCard')
  const labelT = useTranslations('taskLabels')
  const globalT = useTranslations()
  const locale = useLocale()

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
  const swipeEnabled = task.status !== 'completed'

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

  const handleCardClick = () => {
    if (touchMovedRef.current) return

    if (swipeEnabled && swipeState !== 'closed') {
      closeSwipe()
      return
    }

    onToggleExpand()
  }

  return (
    <div ref={rootRef} id={`task-${task.id}`} className="relative">
      <div
        className={`absolute inset-0 overflow-hidden ${
          embedded ? '' : 'rounded-[24px]'
        }`}
      >
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

        {swipeEnabled ? (
          <div className="absolute inset-y-0 left-0 flex items-stretch">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                ;(onSwipeComplete || onComplete)()
                closeSwipe()
              }}
              className="flex w-[96px] items-center justify-center gap-2 text-white"
            >
              <Check
                className="h-5 w-5 transition-transform"
                style={{
                  transform: `scale(${1 + Math.min(translateX / 120, 0.4)})`,
                }}
              />
              <span className="text-sm font-semibold">{t('complete')}</span>
            </button>
          </div>
        ) : null}

        {swipeEnabled ? (
          <div className="absolute inset-y-0 right-0 flex items-stretch">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                closeSwipe()
              }}
              className="flex w-[96px] items-center justify-center gap-2 text-white"
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-sm font-semibold">{t('delete')}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={`relative overflow-hidden bg-white ${
          embedded
            ? ''
            : 'rounded-[24px] border border-[#E7EDF5] shadow-[0_8px_24px_rgba(20,41,82,0.05)]'
        }`}
        style={{
          transform: swipeEnabled ? `translateX(${translateX}px)` : undefined,
          transition: swipeEnabled
            ? dragging
              ? 'none'
              : 'transform 220ms ease'
            : undefined,
          touchAction: swipeEnabled ? 'pan-y' : 'auto',
        }}
        onPointerDown={swipeEnabled ? handlePointerDown : undefined}
        onPointerMove={swipeEnabled ? handlePointerMove : undefined}
        onPointerUp={swipeEnabled ? handlePointerEnd : undefined}
        onPointerCancel={swipeEnabled ? handlePointerEnd : undefined}
      >
        <button
          type="button"
          onClick={handleCardClick}
          className="block w-full text-left"
        >
          <div
            className={`flex items-start gap-4 px-4 ${
              embedded ? 'py-3.5' : 'py-4'
            } ${showDivider && !expanded ? 'border-b border-[#EEF2F8]' : ''}`}
          >
            <div className="flex shrink-0 items-start gap-3">
              <div
                className={`mt-1 shrink-0 rounded-full ${priorityBar} ${
                  embedded ? 'h-12 w-1' : 'h-14 w-1'
                }`}
              />

              <div
                className={`flex shrink-0 items-center justify-center rounded-[14px] ${categoryMeta.iconWrap} ${
                  embedded ? 'h-10 w-10' : 'h-11 w-11'
                }`}
              >
                <CategoryIcon className={embedded ? 'h-4.5 w-4.5' : 'h-5 w-5'} />
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
                compact={embedded}
                hideSecondaryChips={embedded}
                hideTopChips={embedded}
              />

              <div className={embedded ? 'mt-2' : 'mt-3'}>
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
                  compact={embedded}
                  minimal={embedded}
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
              onSetPending={onSetPending}
              onSetInProgress={onSetInProgress}
              onComplete={task.status === 'completed' ? undefined : onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
