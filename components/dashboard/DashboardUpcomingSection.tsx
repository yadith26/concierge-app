'use client'

import { useLocale, useTranslations } from 'next-intl'
import TasksSection from '@/components/tasks/TasksSection'
import type { EditableTask as Task } from '@/lib/tasks/taskTypes'
import { groupUpcomingTasksByDay } from '@/lib/dashboard/dashboardHelpers'

type DashboardUpcomingSectionProps = {
  tasks: Task[]
  expandedTaskId: string | null
  setExpandedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  onComplete: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

export default function DashboardUpcomingSection({
  tasks,
  expandedTaskId,
  setExpandedTaskId,
  onComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: DashboardUpcomingSectionProps) {
  const t = useTranslations('dashboard.upcomingSection')
  const locale = useLocale()

  if (!tasks || tasks.length === 0) return null

  const groupedTasks = groupUpcomingTasksByDay(tasks, locale, {
    today: t('today'),
    tomorrow: t('tomorrow'),
  })

  if (!groupedTasks.length) return null

  return (
    <div className="pt-5">
      <h2 className="px-1 text-[18px] font-bold uppercase tracking-wide text-[#5F6F91]">
        {t('title')}
      </h2>

      <div className="mt-4 space-y-5">
        {groupedTasks.map((group) => (
          <div key={group.key}>
            <div className="mb-3 px-1">
              <p className="text-sm font-semibold capitalize text-[#5E6E8C]">
                {group.label}
              </p>
            </div>

            <TasksSection
              title=""
              tasks={group.tasks}
              expandedTaskId={expandedTaskId}
              setExpandedTaskId={setExpandedTaskId}
              onComplete={onComplete}
              onSetInProgress={onSetInProgress}
              onSetPending={onSetPending}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        ))}
      </div>
    </div>
  )
}