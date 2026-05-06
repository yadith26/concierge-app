'use client'

import { useTranslations } from 'next-intl'
import TasksSection from '@/components/tasks/TasksSection'
import type { EditableTask as Task } from '@/lib/tasks/taskTypes'

type DashboardOverdueSectionProps = {
  tasks?: Task[]
  expandedTaskId: string | null
  setExpandedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  onComplete: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

export default function DashboardOverdueSection({
  tasks = [],
  expandedTaskId,
  setExpandedTaskId,
  onComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: DashboardOverdueSectionProps) {
  const t = useTranslations('dashboard.overdueSection')

  const safeTasks = Array.isArray(tasks) ? tasks : []

  if (safeTasks.length === 0) return null

  return (
    <div className="pt-5">
      <TasksSection
        title={t('title')}
        tasks={safeTasks}
        expandedTaskId={expandedTaskId}
        setExpandedTaskId={setExpandedTaskId}
        onComplete={onComplete}
        onSetInProgress={onSetInProgress}
        onSetPending={onSetPending}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  )
}