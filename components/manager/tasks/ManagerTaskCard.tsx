'use client'

import type { Task } from '@/lib/tasks/taskTypes'

function getCategoryLabel(category?: string) {
  switch (category) {
    case 'repair':
      return 'Reparación'
    case 'cleaning':
      return 'Limpieza'
    case 'pest':
      return 'Plagas'
    case 'visit':
      return 'Visita'
    case 'delivery':
      return 'Entrega'
    default:
      return 'General'
  }
}

function getPriorityColor(priority?: string) {
  switch (priority) {
    case 'high':
      return 'bg-[#F4C430]'
    case 'medium':
      return 'bg-[#E3EAF3]'
    default:
      return 'bg-[#E3EAF3]'
  }
}

function getStatusStyles(status?: string) {
  if (status === 'completed') {
    return 'bg-[#E6F4EA] text-[#2E7D32]'
  }

  return 'bg-[#FFF4F4] text-[#C53030]'
}

function formatDate(date?: string) {
  if (!date) return ''

  const safeDate = new Date(`${date}T12:00:00`)

  return safeDate.toLocaleDateString('es-CA', {
    day: 'numeric',
    month: 'short',
  })
}

export default function ManagerTaskCard({ task }: { task: Task }) {
  return (
    <div className="flex gap-3 rounded-[28px] bg-white p-4 shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
      <div className={`w-[6px] rounded-full ${getPriorityColor(task.priority)}`} />

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-[#EAF0FF] px-3 py-1 text-xs font-semibold text-[#4D63E4]">
            {getCategoryLabel(task.category)}
          </div>

          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(task.status)}`}
          >
            {task.status === 'completed' ? 'Completada' : 'Pendiente'}
          </div>
        </div>

        <p className="text-[17px] font-bold leading-tight text-[#142952]">
          {task.title}
        </p>

        {task.apartment_or_area ? (
          <p className="text-sm text-[#7B8BA8]">{task.apartment_or_area}</p>
        ) : null}

        <div className="text-xs text-[#9AA6BF]">{formatDate(task.task_date)}</div>
      </div>
    </div>
  )
}