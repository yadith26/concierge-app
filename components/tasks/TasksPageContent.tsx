'use client'

import TasksEmptyState from '@/components/tasks/TasksEmptyState'
import TasksFilterBar from '@/components/tasks/TasksFilterBar'
import TasksPageSections from '@/components/tasks/TasksPageSections'
import TaskStatusSummaryCard from '@/components/tasks/TaskStatusSummaryCard'
import type { CategoryFilter, StatusFilter } from '@/lib/tasks/taskPageTypes'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type TaskCounts = {
  totalCount: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  overdueCount: number
  urgentCount: number
}

type TasksPageContentProps = {
  scrollRef: React.RefObject<HTMLElement | null>
  categoryRef: React.RefObject<HTMLDivElement | null>
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: CategoryFilter
  onCategoryChange: (value: CategoryFilter) => void
  statusFilter: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  categoryOpen: boolean
  onToggleCategory: () => void
  onCloseCategory: () => void
  counts: TaskCounts
  onExport: () => void
  showingOnlyOverdue: boolean
  showingOnlyCompleted: boolean
  onTogglePendingSummary: () => void
  pendingSummaryTitle: string
  pendingSummarySubtitle: string
  focusSectionKey:
    | 'pending'
    | 'overdue'
    | 'today'
    | 'tomorrow'
    | 'upcoming'
    | 'completed'
    | null
  filteredTasks: EditableTask[]
  expandedTaskId: string | null
  setExpandedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  todayTasks: EditableTask[]
  tomorrowTasks: EditableTask[]
  upcomingTasks: EditableTask[]
  overdueTasks: EditableTask[]
  completedTasks: EditableTask[]
  onComplete: (id: string) => void
  onSwipeComplete: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: EditableTask) => void
  onEdit: (task: EditableTask) => void
}

export default function TasksPageContent({
  scrollRef,
  categoryRef,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  categoryOpen,
  onToggleCategory,
  onCloseCategory,
  counts,
  onExport,
  showingOnlyOverdue,
  showingOnlyCompleted,
  onTogglePendingSummary,
  pendingSummaryTitle,
  pendingSummarySubtitle,
  focusSectionKey,
  filteredTasks,
  expandedTaskId,
  setExpandedTaskId,
  todayTasks,
  tomorrowTasks,
  upcomingTasks,
  overdueTasks,
  completedTasks,
  onComplete,
  onSwipeComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: TasksPageContentProps) {
  return (
    <section
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 pb-28 pt-3"
    >
      <div className="space-y-4">
        <TasksFilterBar
          search={search}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          categoryOpen={categoryOpen}
          onToggleCategory={onToggleCategory}
          onCloseCategory={onCloseCategory}
          categoryRef={categoryRef}
          counts={counts}
          onExport={onExport}
        />

        {(statusFilter === 'all' || statusFilter === 'pending') &&
        !showingOnlyOverdue &&
        !showingOnlyCompleted ? (
          <TaskStatusSummaryCard
            count={counts.pendingCount}
            title={pendingSummaryTitle}
            subtitle={pendingSummarySubtitle}
            active={statusFilter === 'pending'}
            onClick={onTogglePendingSummary}
          />
        ) : null}

        <TasksPageSections
          key={statusFilter}
          statusFilter={statusFilter}
          focusSectionKey={focusSectionKey}
          filteredTasks={filteredTasks}
          expandedTaskId={expandedTaskId}
          setExpandedTaskId={setExpandedTaskId}
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
          upcomingTasks={upcomingTasks}
          overdueTasks={overdueTasks}
          completedTasks={completedTasks}
          showingOnlyOverdue={showingOnlyOverdue}
          showingOnlyCompleted={showingOnlyCompleted}
          onComplete={onComplete}
          onSwipeComplete={onSwipeComplete}
          onSetInProgress={onSetInProgress}
          onSetPending={onSetPending}
          onDelete={onDelete}
          onEdit={onEdit}
        />

        {filteredTasks.length === 0 ? <TasksEmptyState /> : null}
      </div>
    </section>
  )
}
