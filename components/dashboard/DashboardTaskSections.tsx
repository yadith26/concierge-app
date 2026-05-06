'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ClipboardList } from 'lucide-react'
import TasksSection from '@/components/tasks/TasksSection'
import DashboardOverdueSection from '@/components/dashboard/DashboardOverdueSection'
import DashboardUpcomingSection from '@/components/dashboard/DashboardUpcomingSection'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type DashboardTask = EditableTask
type DashboardStatusFilter = 'all' | 'urgent' | 'pending' | 'completed'

type DashboardTaskSectionsProps = {
  showOverdueTasks: boolean
  statusFilter: DashboardStatusFilter
  todayTasks: DashboardTask[]
  tomorrowTasks: DashboardTask[]
  upcomingTasks: DashboardTask[]
  overdueTasks: DashboardTask[]
  expandedTaskId: string | null
  setExpandedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  todayUrgentCount: number
  onComplete: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: DashboardTask) => void
  onEdit: (task: DashboardTask) => void
}

type SectionEmptyStateProps = {
  title: string
  description: string
}

function SectionEmptyState({
  title,
  description,
}: SectionEmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#D9E0EA] bg-[#F9FBFE] px-5 py-8 text-center">
      <div className="mb-3 flex justify-center">
        <ClipboardList className="h-6 w-6 text-[#9AA8C3]" />
      </div>

      <p className="text-[15px] font-semibold text-[#2E3A59]">{title}</p>

      <p className="mt-1 text-sm text-[#7B8BA8]">{description}</p>
    </div>
  )
}

export default function DashboardTaskSections({
  showOverdueTasks,
  statusFilter,
  todayTasks,
  tomorrowTasks,
  upcomingTasks,
  overdueTasks,
  expandedTaskId,
  setExpandedTaskId,
  todayUrgentCount,
  onComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: DashboardTaskSectionsProps) {
  const t = useTranslations('dashboard.taskSections')

  const sharedSectionProps = useMemo(
    () => ({
      expandedTaskId,
      setExpandedTaskId,
      onComplete,
      onSetInProgress,
      onSetPending,
      onDelete,
      onEdit,
    }),
    [
      expandedTaskId,
      setExpandedTaskId,
      onComplete,
      onSetInProgress,
      onSetPending,
      onDelete,
      onEdit,
    ]
  )

  if (statusFilter === 'completed') {
    return (
      <div className="pt-5">
        {todayTasks.length > 0 ? (
          <TasksSection
            title={t('completedTasks')}
            tasks={todayTasks}
            {...sharedSectionProps}
          />
        ) : (
          <SectionEmptyState
            title={t('emptyCompletedTitle')}
            description={t('emptyCompletedDescription')}
          />
        )}
      </div>
    )
  }

  if (showOverdueTasks) {
    return (
      <DashboardOverdueSection
        tasks={overdueTasks}
        {...sharedSectionProps}
      />
    )
  }

  return (
    <>
      <div className="pt-5">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h2
            className={`text-[18px] font-bold uppercase tracking-wide ${
              todayUrgentCount > 0 ? 'text-[#C65A17]' : 'text-[#5F6F91]'
            }`}
          >
            {t('todayTasks')}
          </h2>

          {todayUrgentCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5D7B2] bg-[#FFF4E8] px-3 py-1.5 text-sm font-semibold text-[#C65A17] shadow-[0_6px_18px_rgba(198,90,23,0.10)]">
              <span>⚠️</span>
              <span>
                {todayUrgentCount}{' '}
                {todayUrgentCount === 1
                  ? t('urgentTodaySingle')
                  : t('urgentTodayPlural')}
              </span>
            </div>
          )}
        </div>

        {todayTasks.length > 0 ? (
          <TasksSection title="" tasks={todayTasks} {...sharedSectionProps} />
        ) : (
          <SectionEmptyState
            title={t('emptyTodayTitle')}
            description={t('emptyTodayDescription')}
          />
        )}
      </div>

      <div className="pt-5">
        {tomorrowTasks.length > 0 ? (
          <TasksSection
            title={t('tomorrowTasks')}
            tasks={tomorrowTasks}
            {...sharedSectionProps}
          />
        ) : (
          <SectionEmptyState
            title={t('emptyTomorrowTitle')}
            description={t('emptyTomorrowDescription')}
          />
        )}
      </div>

      <DashboardUpcomingSection
        tasks={upcomingTasks}
        {...sharedSectionProps}
      />
    </>
  )
}