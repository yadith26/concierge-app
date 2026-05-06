'use client'

import { type Dispatch, type SetStateAction } from 'react'
import TaskCard from './TaskCard'
import type { EditableTask } from '@/lib/tasks/taskTypes'

type TasksSectionProps = {
  title: string
  tasks: EditableTask[]
  hideHeader?: boolean
  expandedTaskId: string | null
  setExpandedTaskId: Dispatch<SetStateAction<string | null>>
  onComplete: (id: string) => void
  onSwipeComplete?: (id: string) => void
  onSetInProgress: (id: string) => void
  onSetPending: (id: string) => void
  onDelete: (task: EditableTask) => void
  onEdit: (task: EditableTask) => void
}

export default function TasksSection({
  title,
  tasks,
  hideHeader = false,
  expandedTaskId,
  setExpandedTaskId,
  onComplete,
  onSwipeComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
}: TasksSectionProps) {
  if (tasks.length === 0) return null

  return (
    <div className="space-y-3">
      {!hideHeader ? (
        <div className="flex items-center gap-3 px-1">
          <h2 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#7B86A8]">
            {title}
          </h2>
          <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-[#DCE7F5] bg-white px-2.5 py-1 text-[14px] font-semibold text-[#4D66DA] shadow-[0_6px_18px_rgba(20,41,82,0.04)]">
            {tasks.length}
          </span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            expanded={expandedTaskId === task.id}
            embedded
            showDivider={tasks[tasks.length - 1]?.id !== task.id}
            onToggleExpand={() =>
              setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
            }
            onComplete={() => onComplete(task.id)}
            onSwipeComplete={() => (onSwipeComplete || onComplete)(task.id)}
            onSetInProgress={() => onSetInProgress(task.id)}
            onSetPending={() => onSetPending(task.id)}
            onDelete={() => onDelete(task)}
            onEdit={() => onEdit(task)}
          />
        ))}
      </div>
    </div>
  )
}
