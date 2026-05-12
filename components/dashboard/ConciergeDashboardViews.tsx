'use client'

import { CalendarDays, CheckCircle2, ListTodo } from 'lucide-react'

import {
  DashboardQuickActions,
  DashboardSpotlightCard,
  DashboardWideListCard,
  type DashboardQuickAction,
  type HotArea,
} from '@/components/dashboard/ConciergeDashboardBuildingSections'
import ConciergeHomeOverview from '@/components/dashboard/ConciergeHomeOverview'
import type { DashboardCopy } from '@/lib/dashboard/dashboardCopy'
import { getTaskDateTime } from '@/lib/dashboard/dashboardHelpers'
import type {
  ConciergeHomeBuilding,
  ConciergeHomeSummary,
  ConciergeHomeTasksByStatus,
} from '@/lib/dashboard/dashboardService'
import { getTaskCardViewModel } from '@/lib/tasks/taskCardView'
import type { EditableTask, TaskPriority } from '@/lib/tasks/taskTypes'

export type { DashboardQuickAction } from '@/components/dashboard/ConciergeDashboardBuildingSections'

export function ConciergeDashboardHomeView({
  buildings,
  summary,
  tasksByStatus,
  onOpenBuilding,
  onOpenTask,
}: {
  buildings: ConciergeHomeBuilding[]
  summary: ConciergeHomeSummary
  tasksByStatus: ConciergeHomeTasksByStatus
  onOpenBuilding: (buildingId: string) => void
  onOpenTask?: (
    buildingId: string,
    taskId: string,
    summaryKey: 'today' | 'urgent' | 'overdue'
  ) => void
}) {
  return (
    <ConciergeHomeOverview
      buildings={buildings}
      summary={summary}
      tasksByStatus={tasksByStatus}
      onOpenBuilding={onOpenBuilding}
      onOpenTask={onOpenTask}
    />
  )
}

export function ConciergeDashboardBuildingView({
  copy,
  locale,
  quickActions,
  expandedTaskId,
  expandedHotAreaKey,
  spotlightTask,
  spotlightReason,
  todayDashboardTasks,
  activeProblems,
  smartReminders,
  hotAreas,
  completedTodayTasks,
  noLocationLabel,
  priorityLabel,
  onToggleExpandTask,
  onToggleHotArea,
  onCompleteTask,
  onSwipeCompleteTask,
  onOpenTask,
  onSetPendingTask,
  onSetInProgressTask,
  onDeleteTask,
  onOpenTodayTasks,
  onOpenProblems,
  onOpenAgenda,
  onOpenAllTasks,
}: {
  copy: DashboardCopy
  locale: string
  quickActions: DashboardQuickAction[]
  expandedTaskId: string | null
  expandedHotAreaKey: string | null
  spotlightTask: EditableTask | null
  spotlightReason: string | null
  todayDashboardTasks: EditableTask[]
  activeProblems: EditableTask[]
  smartReminders: EditableTask[]
  hotAreas: HotArea[]
  completedTodayTasks: EditableTask[]
  noLocationLabel: string
  priorityLabel: (priority: TaskPriority) => string
  onToggleExpandTask: (task: EditableTask) => void
  onToggleHotArea: (itemKey: string) => void
  onCompleteTask: (task: EditableTask) => void
  onSwipeCompleteTask: (task: EditableTask) => void
  onOpenTask: (task: EditableTask) => void
  onSetPendingTask: (task: EditableTask) => void
  onSetInProgressTask: (task: EditableTask) => void
  onDeleteTask: (task: EditableTask) => void
  onOpenTodayTasks: () => void
  onOpenProblems: () => void
  onOpenAgenda: () => void
  onOpenAllTasks: () => void
}) {
  return (
    <div className="space-y-5">
      <DashboardSpotlightCard
        task={spotlightTask}
        label={copy.spotlight}
        reason={spotlightReason}
        expanded={expandedTaskId === spotlightTask?.id}
        locale={locale}
        copy={copy}
        noLocationLabel={noLocationLabel}
        priorityLabel={priorityLabel}
        onComplete={onCompleteTask}
        onSwipeComplete={onSwipeCompleteTask}
        onOpenTask={onOpenTask}
        onSetPending={onSetPendingTask}
        onSetInProgress={onSetInProgressTask}
        onDelete={onDeleteTask}
        onToggleExpand={onToggleExpandTask}
      />

      <DashboardQuickActions
        title={copy.quickActions}
        actions={quickActions}
        columns={quickActions.length === 3 ? 3 : 4}
      />

      <DashboardWideListCard
        title={copy.todayTasks}
        count={todayDashboardTasks.length}
        actionLabel={copy.viewAll}
        onAction={onOpenTodayTasks}
        emptyLabel={copy.noTodayTasks}
        expandedTaskId={expandedTaskId}
        noLocationLabel={noLocationLabel}
        priorityLabel={priorityLabel}
        onToggleTask={onToggleExpandTask}
        onCompleteTask={onCompleteTask}
        onSwipeCompleteTask={onSwipeCompleteTask}
        onOpenTask={onOpenTask}
        onSetPendingTask={onSetPendingTask}
        onSetInProgressTask={onSetInProgressTask}
        onDeleteTask={onDeleteTask}
        items={todayDashboardTasks.map((task) => {
          const { categoryMeta } = getTaskCardViewModel(task)
          const CategoryIcon = categoryMeta.icon

          return {
            key: task.id,
            title: task.title,
            subtitle: task.apartment_or_area || noLocationLabel,
            meta: task.task_time
              ? formatDashboardTaskTime(task.task_time, locale)
              : formatDashboardTaskDate(task.task_date, locale, copy),
            tone:
              task.priority === 'high'
                ? ('red' as const)
                : task.priority === 'medium'
                  ? ('amber' as const)
                  : ('green' as const),
            icon: (
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${categoryMeta.iconWrap}`}
              >
                <CategoryIcon size={20} />
              </span>
            ),
            task,
          }
        })}
      />

      <DashboardWideListCard
        title={copy.activeProblems}
        count={activeProblems.length}
        actionLabel={copy.viewAll}
        onAction={onOpenProblems}
        expandedTaskId={expandedTaskId}
        noLocationLabel={noLocationLabel}
        priorityLabel={priorityLabel}
        onToggleTask={onToggleExpandTask}
        onCompleteTask={onCompleteTask}
        onSwipeCompleteTask={onSwipeCompleteTask}
        onOpenTask={onOpenTask}
        onSetPendingTask={onSetPendingTask}
        onSetInProgressTask={onSetInProgressTask}
        onDeleteTask={onDeleteTask}
        emptyLabel={copy.noActiveProblems}
        items={activeProblems.map((task) => {
          const { categoryMeta } = getTaskCardViewModel(task)
          const CategoryIcon = categoryMeta.icon

          return {
            key: task.id,
            title: task.title,
            subtitle: task.apartment_or_area || noLocationLabel,
            meta: priorityLabel(task.priority),
            tone: task.priority === 'high' ? ('red' as const) : ('amber' as const),
            icon: (
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${categoryMeta.iconWrap}`}
              >
                <CategoryIcon size={20} />
              </span>
            ),
            task,
          }
        })}
      />

      <DashboardWideListCard
        title={copy.smartReminders}
        actionLabel={copy.viewAll}
        onAction={onOpenAgenda}
        expandedTaskId={expandedTaskId}
        noLocationLabel={noLocationLabel}
        priorityLabel={priorityLabel}
        onToggleTask={onToggleExpandTask}
        onCompleteTask={onCompleteTask}
        onSwipeCompleteTask={onSwipeCompleteTask}
        onOpenTask={onOpenTask}
        onSetPendingTask={onSetPendingTask}
        onSetInProgressTask={onSetInProgressTask}
        onDeleteTask={onDeleteTask}
        emptyLabel={copy.noSmartReminders}
        items={smartReminders.map((task) => ({
          key: task.id,
          title: task.title,
          subtitle: task.apartment_or_area || noLocationLabel,
          meta: formatDashboardTaskDate(task.task_date, locale, copy),
          tone: 'green' as const,
          icon: (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF7F0] text-[#248A4E]">
              <CalendarDays size={20} />
            </span>
          ),
          task,
        }))}
      />

      <DashboardWideListCard
        title={copy.hotAreas}
        actionLabel={copy.viewAll}
        onAction={onOpenAllTasks}
        emptyLabel={copy.noHotAreas}
        locale={locale}
        expandedItemKey={expandedHotAreaKey}
        onToggleItem={onToggleHotArea}
        expandedTaskId={expandedTaskId}
        noLocationLabel={noLocationLabel}
        priorityLabel={priorityLabel}
        onToggleTask={onToggleExpandTask}
        onCompleteTask={onCompleteTask}
        onSwipeCompleteTask={onSwipeCompleteTask}
        onOpenTask={onOpenTask}
        onSetPendingTask={onSetPendingTask}
        onSetInProgressTask={onSetInProgressTask}
        onDeleteTask={onDeleteTask}
        items={hotAreas.map((area) => ({
          key: area.name,
          title: area.name,
          subtitle: '',
          meta:
            area.count === 1
              ? copy.singleHotAreaTask
              : copy.hotAreaTasks.replace('{count}', String(area.count)),
          tone:
            area.count >= 3
              ? ('red' as const)
              : area.count === 2
                ? ('amber' as const)
                : ('green' as const),
          icon: (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EEF4FF] text-[#4D66DA]">
              <ListTodo size={20} />
            </span>
          ),
          nestedTasks: area.tasks
            .slice()
            .sort((a, b) => getTaskDateTime(a) - getTaskDateTime(b))
            .slice(0, 5),
        }))}
      />

      <DashboardWideListCard
        title={copy.quickHistory}
        actionLabel={copy.viewAll}
        onAction={onOpenAllTasks}
        expandedTaskId={expandedTaskId}
        noLocationLabel={noLocationLabel}
        priorityLabel={priorityLabel}
        onToggleTask={onToggleExpandTask}
        onOpenTask={onOpenTask}
        onSetPendingTask={onSetPendingTask}
        onSetInProgressTask={onSetInProgressTask}
        onDeleteTask={onDeleteTask}
        disableTaskSwipe
        emptyLabel={copy.noHistoryToday}
        items={completedTodayTasks.map((task) => ({
          key: task.id,
          title: task.title,
          subtitle: task.apartment_or_area || noLocationLabel,
          meta: task.completed_at
            ? `${copy.completedAtLabel} ${new Intl.DateTimeFormat(locale, {
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(task.completed_at))}`
            : '',
          tone: 'green' as const,
          icon: (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7F0] text-[#248A4E]">
              <CheckCircle2 size={18} />
            </span>
          ),
          task,
        }))}
      />
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
    return `${copy.todayWord}, ${new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${taskDate}T12:00:00`))}`
  }

  if (current === tomorrow) {
    return `${copy.tomorrowWord}, ${new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${taskDate}T12:00:00`))}`
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${taskDate}T12:00:00`))
}
