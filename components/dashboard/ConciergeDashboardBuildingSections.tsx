'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Trash2,
} from 'lucide-react'

import TaskCardExpandedContent from '@/components/tasks/task-card/TaskCardExpandedContent'
import useTaskCardSwipe from '@/hooks/useTaskCardSwipe'
import type { DashboardCopy } from '@/lib/dashboard/dashboardCopy'
import { getTaskCardViewModel } from '@/lib/tasks/taskCardView'
import { formatTaskDate } from '@/lib/tasks/taskLabels'
import type { EditableTask, TaskPriority } from '@/lib/tasks/taskTypes'

export type DashboardQuickAction = {
  key: string
  label: string
  icon: ReactNode
  tone: 'blue' | 'violet' | 'indigo' | 'green'
  onClick: () => void
}

export type HotArea = {
  name: string
  count: number
  tasks: EditableTask[]
}

export function DashboardSpotlightCard({
  task,
  label,
  reason,
  expanded,
  locale,
  copy,
  noLocationLabel,
  priorityLabel,
  onComplete,
  onSwipeComplete,
  onOpenTask,
  onSetPending,
  onSetInProgress,
  onDelete,
  onToggleExpand,
}: {
  task: EditableTask | null
  label: string
  reason: string | null
  expanded: boolean
  locale: string
  copy: DashboardCopy
  noLocationLabel: string
  priorityLabel: (priority: TaskPriority) => string
  onComplete: (task: EditableTask) => void
  onSwipeComplete?: (task: EditableTask) => void
  onOpenTask: (task: EditableTask) => void
  onSetPending: (task: EditableTask) => void
  onSetInProgress: (task: EditableTask) => void
  onDelete: (task: EditableTask) => void
  onToggleExpand: (task: EditableTask) => void
}) {
  const tTaskCard = useTranslations('taskCard')
  const {
    rootRef,
    translateX,
    dragging,
    touchMovedRef,
    closeSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTaskCardSwipe()

  if (!task) {
    return (
      <section className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8A92B2]">
              {label}
            </p>
            <h2 className="mt-1 text-[20px] font-bold text-[#142952]">
              {copy.noTasks}
            </h2>
          </div>
        </div>
      </section>
    )
  }

  const {
    categoryMeta,
    apartmentSummary,
    hasPhotos,
    pestTargets,
    taskApartments,
  } = getTaskCardViewModel(task)
  const CategoryIcon = categoryMeta.icon

  const handleCardClick = () => {
    if (touchMovedRef.current) return
    onToggleExpand(task)
  }

  return (
    <div ref={rootRef} className="relative">
      <SwipeBackground
        translateX={translateX}
        completeLabel={copy.completeTask}
        deleteLabel={tTaskCard('delete')}
        onComplete={() => {
          ;(onSwipeComplete || onComplete)(task)
          closeSwipe()
        }}
        onDelete={() => {
          onDelete(task)
          closeSwipe()
        }}
      />

      <div
        className="relative overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 220ms ease',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={handleCardClick}
          className="block w-full px-4 py-4 text-left"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] ${categoryMeta.iconWrap}`}
            >
              <CategoryIcon size={28} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8A92B2]">
                {label}
              </p>
              {reason ? (
                <span className="mt-2 inline-flex rounded-full bg-[#F3F6FC] px-3 py-1 text-[12px] font-semibold text-[#6B7A9A]">
                  {reason}
                </span>
              ) : null}
              <h2 className="mt-1 text-[20px] font-bold leading-tight text-[#142952]">
                {task.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-[#4E5C7A]">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-[#8A97B3]" />
                  {task.apartment_or_area || noLocationLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${getPriorityDot(task.priority)}`}
                  />
                  {priorityLabel(task.priority)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} className="text-[#8A97B3]" />
                  {formatDashboardTaskDate(task.task_date, locale, copy)}
                </span>
                {task.task_time ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} className="text-[#8A97B3]" />
                    {formatDashboardTaskTime(task.task_time, locale)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </button>

        <div className="px-4 pb-4">
          {task.status !== 'completed' ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onComplete(task)
              }}
              className="flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-[#4B63DF] px-4 py-3.5 text-[16px] font-semibold text-white shadow-[0_14px_28px_rgba(75,99,223,0.24)]"
            >
              <CheckCircle2 size={20} />
              {copy.completeTask}
            </button>
          ) : null}
        </div>

        <ExpandableTaskDetails
          expanded={expanded}
          task={task}
          apartmentSummary={apartmentSummary}
          hasPhotos={hasPhotos}
          pestTargets={pestTargets}
          taskApartments={taskApartments}
          onSetPending={() => onSetPending(task)}
          onSetInProgress={() => onSetInProgress(task)}
          onComplete={task.status === 'completed' ? undefined : () => onComplete(task)}
          onEdit={() => onOpenTask(task)}
          onDelete={() => onDelete(task)}
        />
      </div>
    </div>
  )
}

export function DashboardQuickActions({
  title,
  actions,
  columns = 4,
}: {
  title: string
  actions: DashboardQuickAction[]
  columns?: 3 | 4
}) {
  return (
    <section>
      <div className="mb-3 px-1">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#5E6A8E]">
          {title}
        </h2>
      </div>

      <div
        className={`grid gap-2.5 ${
          columns === 3 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
      >
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[20px] border border-[#E7EDF5] bg-white px-2 py-3 text-center shadow-[0_10px_24px_rgba(20,41,82,0.06)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(20,41,82,0.08)] active:scale-[0.96]"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${getQuickActionTone(
                action.tone
              )}`}
            >
              {action.icon}
            </span>

            <span className="whitespace-pre-line text-[12px] font-semibold leading-[1.15] text-[#142952]">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function DashboardInlineInfo({
  message,
}: {
  message: string
}) {
  return (
    <section className="rounded-[22px] border border-[#F6D7DB] bg-[#FFF5F6] px-4 py-3 text-sm text-[#B14A58] shadow-[0_8px_24px_rgba(20,41,82,0.04)]">
      {message}
    </section>
  )
}

export function DashboardWideListCard({
  title,
  count,
  actionLabel,
  onAction,
  emptyLabel,
  locale = 'es',
  expandedItemKey,
  onToggleItem,
  expandedTaskId,
  noLocationLabel,
  priorityLabel,
  onToggleTask,
  onCompleteTask,
  onSwipeCompleteTask,
  onOpenTask,
  onSetPendingTask,
  onSetInProgressTask,
  onDeleteTask,
  disableTaskSwipe = false,
  items,
}: {
  title: string
  count?: number
  actionLabel: string
  onAction: () => void
  emptyLabel: string
  locale?: string
  expandedItemKey?: string | null
  onToggleItem?: (itemKey: string) => void
  expandedTaskId?: string | null
  noLocationLabel?: string
  priorityLabel?: (priority: TaskPriority) => string
  onToggleTask?: (task: EditableTask) => void
  onCompleteTask?: (task: EditableTask) => void
  onSwipeCompleteTask?: (task: EditableTask) => void
  onOpenTask?: (task: EditableTask) => void
  onSetPendingTask?: (task: EditableTask) => void
  onSetInProgressTask?: (task: EditableTask) => void
  onDeleteTask?: (task: EditableTask) => void
  disableTaskSwipe?: boolean
  items: Array<{
    key: string
    title: string
    subtitle: string
    meta: string
    tone: 'red' | 'amber' | 'green'
    icon: ReactNode
    task?: EditableTask
    nestedTasks?: EditableTask[]
  }>
}) {
  const tTaskCard = useTranslations('taskCard')

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#7B86A8]">
            {title}
          </h2>
          {typeof count === 'number' ? (
            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-[#FFF4F5] px-2 py-0.5 text-[12px] font-semibold text-[#D64555]">
              {count}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onAction}
          className="text-[14px] font-semibold text-[#4D66DA]"
        >
          {actionLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 pb-5 text-sm text-[#7B86A8]">{emptyLabel}</div>
      ) : (
        <div className="px-4 pb-4">
          {items.map((item, index) => (
            <div
              key={item.key}
              className={index < items.length - 1 ? 'border-b border-[#EEF2F8]' : ''}
            >
              {item.task && onToggleTask ? (
                <DashboardSwipeTaskRow
                  title={item.title}
                  subtitle={item.subtitle}
                  meta={item.meta}
                  tone={item.tone}
                  icon={item.icon}
                  completeLabel={tTaskCard('complete')}
                  deleteLabel={tTaskCard('delete')}
                  swipeEnabled={!disableTaskSwipe && item.task.status !== 'completed'}
                  onClick={() => onToggleTask(item.task!)}
                  onComplete={
                    item.task.status === 'completed' || !onCompleteTask
                      ? undefined
                      : () => onCompleteTask(item.task!)
                  }
                  onSwipeComplete={
                    item.task.status !== 'completed' && onSwipeCompleteTask
                      ? () => onSwipeCompleteTask(item.task!)
                      : undefined
                  }
                  onDelete={onDeleteTask ? () => onDeleteTask(item.task!) : undefined}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (item.nestedTasks?.length && onToggleItem) {
                      onToggleItem(item.key)
                    }
                  }}
                  className="flex w-full items-start gap-3 py-3 text-left"
                >
                  {item.icon}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[18px] font-semibold text-[#142952]">
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className="mt-0.5 text-[14px] text-[#6E7F9D]">
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 text-[14px] font-semibold ${getInfoToneText(item.tone)}`}
                  >
                    {item.meta}
                  </span>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-[#8A97B3]" />
                </button>
              )}

              {item.nestedTasks?.length &&
              expandedItemKey === item.key &&
              noLocationLabel &&
              priorityLabel &&
              onToggleTask &&
              onOpenTask &&
              onSetPendingTask &&
              onSetInProgressTask &&
              onDeleteTask ? (
                <div className="space-y-1 border-t border-[#EEF2F8] pb-2 pt-2">
                  {item.nestedTasks.map((task) => {
                    const {
                      categoryMeta,
                      apartmentSummary,
                      hasPhotos,
                      pestTargets,
                      taskApartments,
                    } = getTaskCardViewModel(task)
                    const CategoryIcon = categoryMeta.icon

                    return (
                      <div
                        key={task.id}
                        className="overflow-hidden rounded-[18px] bg-[#F8FAFE]"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleTask(task)}
                          className="flex w-full items-start gap-3 px-3 py-3 text-left"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${categoryMeta.iconWrap}`}
                          >
                            <CategoryIcon size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-[#142952]">
                              {task.title}
                            </p>
                            <p className="mt-0.5 text-[13px] text-[#6E7F9D]">
                              {task.apartment_or_area || noLocationLabel} •{' '}
                              {priorityLabel(task.priority)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[13px] font-semibold ${getInfoToneText(
                              task.priority === 'high'
                                ? 'red'
                                : task.priority === 'medium'
                                  ? 'amber'
                                  : 'green'
                            )}`}
                          >
                            {task.task_time
                              ? formatDashboardTaskTime(task.task_time, locale)
                              : formatTaskDate(task.task_date, locale)}
                          </span>
                          <ChevronRight
                            size={16}
                            className="mt-0.5 shrink-0 text-[#8A97B3]"
                          />
                        </button>

                        {expandedTaskId === task.id ? (
                          <ExpandableTaskDetails
                            expanded
                            task={task}
                            apartmentSummary={apartmentSummary}
                            hasPhotos={hasPhotos}
                            pestTargets={pestTargets}
                            taskApartments={taskApartments}
                            onSetPending={() => onSetPendingTask(task)}
                            onSetInProgress={() => onSetInProgressTask(task)}
                            onComplete={
                              task.status === 'completed' || !onCompleteTask
                                ? undefined
                                : () => onCompleteTask(task)
                            }
                            onEdit={() => onOpenTask(task)}
                            onDelete={() => onDeleteTask(task)}
                            withTopBorder
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {item.task &&
              expandedTaskId === item.task.id &&
              noLocationLabel &&
              priorityLabel &&
              onOpenTask &&
              onSetPendingTask &&
              onSetInProgressTask &&
              onDeleteTask ? (
                <ExpandableTaskDetails
                  expanded
                  task={item.task}
                  apartmentSummary={getTaskCardViewModel(item.task).apartmentSummary}
                  hasPhotos={getTaskCardViewModel(item.task).hasPhotos}
                  pestTargets={getTaskCardViewModel(item.task).pestTargets}
                  taskApartments={getTaskCardViewModel(item.task).taskApartments}
                  onSetPending={() => onSetPendingTask(item.task!)}
                  onSetInProgress={() => onSetInProgressTask(item.task!)}
                  onComplete={
                    item.task.status === 'completed' || !onCompleteTask
                      ? undefined
                      : () => onCompleteTask(item.task!)
                  }
                  onEdit={() => onOpenTask(item.task!)}
                  onDelete={() => onDeleteTask(item.task!)}
                  withTopBorder
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DashboardSwipeTaskRow({
  title,
  subtitle,
  meta,
  tone,
  icon,
  completeLabel,
  deleteLabel,
  compact = false,
  swipeEnabled = true,
  onClick,
  onComplete,
  onSwipeComplete,
  onDelete,
}: {
  title: string
  subtitle: string
  meta: string
  tone: 'red' | 'amber' | 'green'
  icon: ReactNode
  completeLabel: string
  deleteLabel: string
  compact?: boolean
  swipeEnabled?: boolean
  onClick: () => void
  onComplete?: () => void
  onSwipeComplete?: () => void
  onDelete?: () => void
}) {
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTaskCardSwipe()

  const handleRowClick = () => {
    if (touchMovedRef.current) return
    if (swipeEnabled && swipeState !== 'closed') {
      closeSwipe()
      return
    }
    onClick()
  }

  return (
    <div ref={rootRef} className="relative">
      {swipeEnabled ? (
        <SwipeBackground
          translateX={translateX}
          completeLabel={completeLabel}
          deleteLabel={deleteLabel}
          compact={compact}
          onComplete={
            onComplete || onSwipeComplete
              ? () => {
                  ;(onSwipeComplete || onComplete)?.()
                  closeSwipe()
                }
              : undefined
          }
          onDelete={() => {
            onDelete?.()
            closeSwipe()
          }}
        />
      ) : null}

      <div
        className={`relative overflow-hidden bg-white ${
          compact ? 'rounded-[18px]' : 'rounded-[24px]'
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
        onTouchStart={swipeEnabled ? handleTouchStart : undefined}
        onTouchMove={swipeEnabled ? handleTouchMove : undefined}
        onTouchEnd={swipeEnabled ? handleTouchEnd : undefined}
      >
        <button
          type="button"
          onClick={handleRowClick}
          className={`flex w-full items-start gap-3 text-left ${
            compact ? 'px-3 py-3' : 'py-3'
          }`}
        >
          {icon}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-semibold text-[#142952] ${
                compact ? 'text-[15px]' : 'text-[18px]'
              }`}
            >
              {title}
            </p>
            {subtitle ? (
              <p
                className={`mt-0.5 text-[#6E7F9D] ${
                  compact ? 'text-[13px]' : 'text-[14px]'
                }`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          <span
            className={`shrink-0 font-semibold ${getInfoToneText(tone)} ${
              compact ? 'text-[13px]' : 'text-[14px]'
            }`}
          >
            {meta}
          </span>
          <ChevronRight
            size={compact ? 16 : 18}
            className="mt-0.5 shrink-0 text-[#8A97B3]"
          />
        </button>
      </div>
    </div>
  )
}

function ExpandableTaskDetails({
  expanded,
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
  withTopBorder = false,
}: {
  expanded: boolean
  task: EditableTask
  apartmentSummary: string | null
  hasPhotos: boolean
  pestTargets: EditableTask['pest_targets']
  taskApartments: EditableTask['task_apartments']
  onSetPending: () => void
  onSetInProgress: () => void
  onComplete?: () => void
  onEdit: () => void
  onDelete: () => void
  withTopBorder?: boolean
}) {
  return (
    <div
      className={`grid transition-all duration-300 ${
        expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className={withTopBorder ? 'border-t border-[#EEF2F8]' : ''}>
          <TaskCardExpandedContent
            task={task}
            apartmentSummary={apartmentSummary}
            hasPhotos={hasPhotos}
            pestTargets={pestTargets || []}
            taskApartments={taskApartments || []}
            onSetPending={onSetPending}
            onSetInProgress={onSetInProgress}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}

function SwipeBackground({
  translateX,
  completeLabel,
  deleteLabel,
  compact = false,
  onComplete,
  onDelete,
}: {
  translateX: number
  completeLabel: string
  deleteLabel: string
  compact?: boolean
  onComplete?: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${
        compact ? 'rounded-[18px]' : 'rounded-[24px]'
      }`}
    >
      <div
        className="absolute inset-0 transition-colors duration-200"
        style={{
          background:
            translateX > 0
              ? `rgba(121,196,124, ${Math.min(translateX / 120, 1)})`
              : translateX < 0
                ? `rgba(230,91,103, ${Math.min(Math.abs(translateX) / 120, 1)})`
                : 'transparent',
        }}
      />

      <div className="absolute inset-y-0 left-0 flex items-stretch">
        {onComplete ? (
          <button
            type="button"
            onClick={onComplete}
            className="flex w-[96px] items-center justify-center gap-2 text-white"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-semibold">{completeLabel}</span>
          </button>
        ) : null}
      </div>

      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="flex w-[96px] items-center justify-center gap-2 text-white"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{deleteLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

function formatDashboardTaskTime(taskTime: string, locale: string) {
  const [hours = '0', minutes = '0'] = taskTime.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDashboardTaskDate(
  taskDate: string,
  locale: string,
  copy: DashboardCopy
) {
  const today = new Date().toLocaleDateString('en-CA')
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = tomorrowDate.toLocaleDateString('en-CA')
  const current = new Date(`${taskDate}T12:00:00`).toLocaleDateString('en-CA')

  if (current === today) {
    return `${copy.todayWord}, ${formatTaskDate(taskDate, locale)}`
  }

  if (current === tomorrow) {
    return `${copy.tomorrowWord}, ${formatTaskDate(taskDate, locale)}`
  }

  return formatTaskDate(taskDate, locale)
}

function getPriorityDot(priority: TaskPriority) {
  if (priority === 'high') return 'bg-[#F25C54]'
  if (priority === 'medium') return 'bg-[#F6A623]'
  return 'bg-[#2BAA60]'
}

function getQuickActionTone(tone: DashboardQuickAction['tone']) {
  if (tone === 'blue') return 'bg-[#EEF4FF] text-[#4D66DA]'
  if (tone === 'violet') return 'bg-[#F3EEFF] text-[#7A5AC7]'
  if (tone === 'green') return 'bg-[#EAF7F0] text-[#248A4E]'
  return 'bg-[#EEF4FF] text-[#2F66C8]'
}

function getInfoToneText(tone: 'red' | 'amber' | 'green') {
  if (tone === 'red') return 'text-[#D64555]'
  if (tone === 'amber') return 'text-[#D9811E]'
  return 'text-[#248A4E]'
}
