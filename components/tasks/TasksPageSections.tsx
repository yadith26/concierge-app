'use client'

import { ChevronDown } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useTranslations } from 'next-intl'
import TasksSection from '@/components/tasks/TasksSection'
import type { EditableTask } from '@/lib/tasks/taskTypes'
import type { StatusFilter } from '@/lib/tasks/taskPageTypes'

type TasksPageSectionsProps = {
  statusFilter: StatusFilter
  focusSectionKey?:
    | 'pending'
    | 'overdue'
    | 'today'
    | 'tomorrow'
    | 'upcoming'
    | 'completed'
    | null
  filteredTasks: EditableTask[]
  expandedTaskId: string | null
  setExpandedTaskId: Dispatch<SetStateAction<string | null>>
  todayTasks: EditableTask[]
  tomorrowTasks: EditableTask[]
  upcomingTasks: EditableTask[]
  overdueTasks: EditableTask[]
  completedTasks: EditableTask[]
  showingOnlyOverdue: boolean
  showingOnlyCompleted: boolean
  showingOnlyToday?: boolean
  onComplete: (id: string) => void
  onSwipeComplete?: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: EditableTask) => void
  onEdit: (task: EditableTask) => void
}

export default function TasksPageSections({
  statusFilter,
  focusSectionKey = null,
  filteredTasks,
  expandedTaskId,
  setExpandedTaskId,
  todayTasks,
  tomorrowTasks,
  upcomingTasks,
  overdueTasks,
  completedTasks,
  showingOnlyOverdue,
  showingOnlyCompleted,
  showingOnlyToday = false,
  onComplete,
  onSwipeComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: TasksPageSectionsProps) {
  const t = useTranslations('tasksPageSections')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    getInitialOpenSections(statusFilter)
  )

  useEffect(() => {
    setOpenSections(getInitialOpenSections(statusFilter))
  }, [statusFilter])

  useEffect(() => {
    if (!focusSectionKey) return

    setOpenSections((current) => ({
      ...current,
      [focusSectionKey]: true,
    }))
  }, [focusSectionKey])

  const sharedSectionProps = useMemo(
    () => ({
      expandedTaskId,
      setExpandedTaskId,
      onComplete,
      onSwipeComplete,
      onSetInProgress,
      onSetPending,
      onDelete,
      onEdit,
    }),
    [
      expandedTaskId,
      setExpandedTaskId,
      onComplete,
      onSwipeComplete,
      onSetInProgress,
      onSetPending,
      onDelete,
      onEdit,
    ]
  )

  const defaultSections = useMemo(
    () => {
      if (statusFilter === 'pending') {
        return [
          {
            key: 'pending',
            title: t('pendingTasks'),
            tasks: filteredTasks,
          },
        ]
      }

      const sections = []

      if (statusFilter === 'in_progress' || statusFilter === 'urgent') {
        sections.push({
          key: 'overdue',
          title: t('overdueTasks'),
          tasks: overdueTasks,
        })
      }

      sections.push(
        { key: 'today', title: t('todayTasks'), tasks: todayTasks },
        { key: 'tomorrow', title: t('tomorrowTasks'), tasks: tomorrowTasks },
        { key: 'upcoming', title: t('upcomingTasks'), tasks: upcomingTasks },
        { key: 'completed', title: t('completedTasks'), tasks: completedTasks }
      )

      return sections
    },
    [statusFilter, t, filteredTasks, overdueTasks, todayTasks, tomorrowTasks, upcomingTasks, completedTasks]
  )

  const toggleSection = (sectionKey: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }))
  }

  if (showingOnlyOverdue) {
    return (
      <CollapsibleTasksSection
        sectionKey="overdue"
        title={t('overdueTasks')}
        tasks={overdueTasks}
        open={openSections.overdue}
        onToggle={toggleSection}
        {...sharedSectionProps}
      />
    )
  }

  if (showingOnlyCompleted) {
    return (
      <CollapsibleTasksSection
        sectionKey="completed"
        title={t('completedTasks')}
        tasks={completedTasks}
        open={openSections.completed}
        onToggle={toggleSection}
        {...sharedSectionProps}
      />
    )
  }

  if (showingOnlyToday) {
    return (
      <CollapsibleTasksSection
        sectionKey="today"
        title={t('todayTasks')}
        tasks={todayTasks}
        open={openSections.today}
        onToggle={toggleSection}
        {...sharedSectionProps}
      />
    )
  }

  if (statusFilter === 'pending') {
    return (
      <CollapsibleTasksSection
        sectionKey="pending"
        title={t('pendingTasks')}
        tasks={filteredTasks}
        open={openSections.pending}
        onToggle={toggleSection}
        {...sharedSectionProps}
      />
    )
  }

  return (
    <>
      {defaultSections.map((section) => (
        <CollapsibleTasksSection
          key={section.key}
          sectionKey={section.key}
          title={section.title}
          tasks={section.tasks}
          open={openSections[section.key]}
          onToggle={toggleSection}
          {...sharedSectionProps}
        />
      ))}
    </>
  )
}

type CollapsibleTasksSectionProps = {
  sectionKey: string
  title: string
  tasks: EditableTask[]
  open?: boolean
  onToggle: (sectionKey: string) => void
  expandedTaskId: string | null
  setExpandedTaskId: Dispatch<SetStateAction<string | null>>
  onComplete: (id: string) => void
  onSwipeComplete?: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: EditableTask) => void
  onEdit: (task: EditableTask) => void
}

function CollapsibleTasksSection({
  sectionKey,
  title,
  tasks,
  open = false,
  onToggle,
  ...sectionProps
}: CollapsibleTasksSectionProps) {
  if (tasks.length === 0) return null

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-[#E7EDF5] bg-white px-4 py-3 text-left shadow-[0_6px_18px_rgba(20,41,82,0.04)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#7B86A8]">
            {title}
          </h2>
          <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-[#DCE7F5] bg-[#EEF4FF] px-2.5 py-1 text-[14px] font-semibold text-[#4D66DA]">
            {tasks.length}
          </span>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F6FB] text-[#8C9AB3]">
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open ? (
        <TasksSection
          title={title}
          tasks={tasks}
          hideHeader
          {...sectionProps}
        />
      ) : null}
    </div>
  )
}

function getInitialOpenSections(statusFilter: StatusFilter): Record<string, boolean> {
  if (statusFilter === 'today') {
    return {
      pending: false,
      overdue: false,
      today: true,
      tomorrow: false,
      upcoming: false,
      completed: false,
    }
  }

  if (statusFilter === 'overdue') {
    return {
      pending: false,
      overdue: true,
      today: false,
      tomorrow: false,
      upcoming: false,
      completed: false,
    }
  }

  if (statusFilter === 'completed') {
    return {
      pending: false,
      overdue: false,
      today: false,
      tomorrow: false,
      upcoming: false,
      completed: true,
    }
  }

  if (statusFilter === 'pending' || statusFilter === 'in_progress' || statusFilter === 'urgent') {
    return {
      pending: statusFilter === 'pending',
      overdue: statusFilter !== 'pending',
      today: statusFilter !== 'pending',
      tomorrow: statusFilter !== 'pending',
      upcoming: statusFilter !== 'pending',
      completed: false,
    }
  }

  return {
    pending: false,
    overdue: false,
    today: true,
    tomorrow: false,
    upcoming: false,
    completed: false,
  }
}
