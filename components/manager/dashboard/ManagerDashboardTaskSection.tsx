'use client'

import { ClipboardList } from 'lucide-react'
import type { Task } from '@/lib/tasks/taskTypes'
import ManagerReadonlyTaskCard from '@/components/manager/dashboard/ManagerReadonlyTaskCard'

type ManagerDashboardTaskSectionProps = {
  title: string
  tasks: Task[]
  expandedTaskId: string | null
  onToggleTask: (taskId: string) => void
}

export default function ManagerDashboardTaskSection({
  title,
  tasks,
  expandedTaskId,
  onToggleTask,
}: ManagerDashboardTaskSectionProps) {
  return (
    <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#142952]">
        <span className="text-[#2F66C8]">
          <ClipboardList size={18} />
        </span>
        {title}
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <ManagerReadonlyTaskCard
            key={task.id}
            task={task}
            expanded={expandedTaskId === task.id}
            onToggleExpand={() => onToggleTask(task.id)}
          />
        ))}

        {tasks.length === 0 ? (
          <p className="text-sm text-[#7B8BA8]">
            No hay tareas para este filtro.
          </p>
        ) : null}
      </div>
    </section>
  )
}
