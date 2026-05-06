'use client'

import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import ManagerPrivateTaskCard from '@/components/manager/ManagerPrivateTaskCard'
import type {
  ManagerTask,
  ManagerTaskSummary,
} from '@/lib/manager/managerTaskService'
import type { TaskStatus } from '@/lib/tasks/taskTypes'

export type ManagerHomeTaskFilter = 'overdue' | 'today' | 'upcoming'

type ManagerHomeTaskSummaryProps = {
  summary: ManagerTaskSummary
  activeFilter: ManagerHomeTaskFilter
  groupOpen: boolean
  expandedTaskId: string | null
  buildingNameById: Record<string, string>
  onFilterChange: (filter: ManagerHomeTaskFilter) => void
  onToggleGroup: () => void
  onToggleTask: (taskId: string) => void
  onTaskStatusChange: (task: ManagerTask, status: TaskStatus) => void
  onEditTask: (task: ManagerTask) => void
  onDeleteTask: (task: ManagerTask) => void
  onOpenTasks: () => void
}

export default function ManagerHomeTaskSummary({
  summary,
  activeFilter,
  groupOpen,
  expandedTaskId,
  buildingNameById,
  onFilterChange,
  onToggleGroup,
  onToggleTask,
  onTaskStatusChange,
  onEditTask,
  onDeleteTask,
  onOpenTasks,
}: ManagerHomeTaskSummaryProps) {
  const filteredTasks = summary[activeFilter]
  const activeTitle = getFilterTitle(activeFilter)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[24px] font-bold tracking-tight text-[#142952]">
          Resumen de tus tareas
        </h2>
        <button
          type="button"
          onClick={onOpenTasks}
          className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#2F66C8]"
        >
          Ver todas
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryTile
          active={activeFilter === 'overdue'}
          caption="Requieren atencion"
          icon={<AlertTriangle size={20} />}
          label="vencidas"
          onClick={() => onFilterChange('overdue')}
          value={summary.overdue.length}
          tone="red"
        />
        <SummaryTile
          active={activeFilter === 'today'}
          caption="Para completar"
          icon={<CalendarClock size={20} />}
          label="Hoy"
          onClick={() => onFilterChange('today')}
          value={summary.today.length}
          tone="blue"
        />
        <SummaryTile
          active={activeFilter === 'upcoming'}
          caption="En los proximos dias"
          icon={<Clock3 size={20} />}
          label="Proximas"
          onClick={() => onFilterChange('upcoming')}
          value={summary.upcoming.length}
          tone="purple"
        />
      </div>

      <div className="rounded-[24px] border border-[#E3EAF3] bg-white p-5 shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
        <button
          type="button"
          onClick={onToggleGroup}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <h3 className="text-[22px] font-bold text-[#142952]">
              {activeTitle}
            </h3>
            <p className="mt-1 text-[15px] font-medium text-[#7B8BA8]">
              {filteredTasks.length === 1
                ? '1 tarea administrativa'
                : `${filteredTasks.length} tareas administrativas`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#2F66C8]">
              {filteredTasks.length}
            </span>
            <ChevronDown
              size={20}
              className={`text-[#7B8BA8] transition ${
                groupOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {groupOpen ? (
          <div className="mt-5 space-y-3 border-t border-[#EEF2F7] pt-4">
            {filteredTasks.length > 0 ? (
              <>
                {filteredTasks.slice(0, 4).map((task) => (
                  <ManagerPrivateTaskCard
                    key={task.id}
                    task={task}
                    buildingName={
                      task.building_id
                        ? buildingNameById[task.building_id] || 'Edificio'
                        : 'General'
                    }
                    expanded={expandedTaskId === task.id}
                    onToggleExpand={() => onToggleTask(task.id)}
                    onStatusChange={(status) => onTaskStatusChange(task, status)}
                    onEdit={() => onEditTask(task)}
                    onDelete={() => onDeleteTask(task)}
                  />
                ))}

                {filteredTasks.length > 4 ? (
                  <button
                    type="button"
                    onClick={onOpenTasks}
                    className="inline-flex text-sm font-bold text-[#2F66C8]"
                  >
                    Ver {filteredTasks.length - 4} mas
                  </button>
                ) : null}
              </>
            ) : (
              <p className="rounded-[20px] bg-[#F8FAFD] px-4 py-4 text-sm font-medium text-[#6E7F9D]">
                No hay tareas en este grupo.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function getFilterTitle(filter: ManagerHomeTaskFilter) {
  if (filter === 'overdue') return 'Tareas vencidas'
  if (filter === 'upcoming') return 'Proximas tareas'
  return 'Tareas de hoy'
}

function SummaryTile({
  active,
  icon,
  label,
  value,
  caption,
  tone,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  value: number
  caption: string
  tone: 'blue' | 'purple' | 'red'
  onClick: () => void
}) {
  const styles = {
    blue: {
      surface: 'bg-[#EEF4FF]',
      text: 'text-[#2F66C8]',
      icon: 'text-[#2F66C8]',
    },
    purple: {
      surface: 'bg-[#F0EEFF]',
      text: 'text-[#6754C8]',
      icon: 'text-[#6754C8]',
    },
    red: {
      surface: 'bg-[#FFF0ED]',
      text: 'text-[#A43A33]',
      icon: 'text-[#A43A33]',
    },
  }
  const current = styles[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[104px] rounded-[24px] border p-4 text-left transition ${current.surface} ${
        active
          ? 'border-[#2F66C8] shadow-[0_10px_24px_rgba(47,102,200,0.12)]'
          : 'border-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[32px] font-bold leading-none text-[#142952]">
          {value}
        </p>
        <span className={current.icon}>{icon}</span>
      </div>
      <div className="mt-3">
        <p className={`mt-1 truncate text-[13px] font-bold ${current.text}`}>
          {label}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-4 text-[#6E7F9D]">
          {caption}
        </p>
      </div>
    </button>
  )
}
