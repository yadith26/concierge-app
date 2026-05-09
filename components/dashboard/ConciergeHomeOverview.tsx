'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CalendarCheck2,
  ChevronRight,
  Clock3,
  Wrench,
} from 'lucide-react'
import type {
  ConciergeHomeBuilding,
  ConciergeHomeSummary,
  ConciergeHomeTask,
  ConciergeHomeTasksByStatus,
} from '@/lib/dashboard/dashboardService'

type ConciergeHomeOverviewProps = {
  buildings: ConciergeHomeBuilding[]
  summary: ConciergeHomeSummary
  tasksByStatus: ConciergeHomeTasksByStatus
  onOpenBuilding: (buildingId: string) => void
  onOpenTask?: (
    buildingId: string,
    taskId: string,
    summaryKey: 'today' | 'urgent' | 'overdue'
  ) => void
}

function pluralize(count: number, single: string, plural: string) {
  return count === 1 ? single : plural
}

export default function ConciergeHomeOverview({
  buildings,
  summary,
  tasksByStatus,
  onOpenBuilding,
  onOpenTask,
}: ConciergeHomeOverviewProps) {
  const [activeSummaryKey, setActiveSummaryKey] = useState<
    'today' | 'urgent' | 'overdue' | null
  >(null)

  const summaryCards = useMemo(
    () => [
      {
        key: 'today' as const,
        icon: <CalendarCheck2 size={15} />,
        label: 'Hoy',
        value: summary.today,
        tone: 'bg-[#EEF4FF] text-[#2F66C8]',
      },
      {
        key: 'urgent' as const,
        icon: <AlertTriangle size={15} />,
        label: 'Urgentes',
        value: summary.urgent,
        tone: 'bg-[#FFF3E0] text-[#B7791F]',
      },
      {
        key: 'overdue' as const,
        icon: <Clock3 size={15} />,
        label: 'Atrasadas',
        value: summary.overdue,
        tone: 'bg-[#FFF1F1] text-[#C53030]',
      },
    ],
    [summary.overdue, summary.today, summary.urgent]
  )

  const activeSummaryTasks = useMemo(() => {
    if (!activeSummaryKey) return []
    return tasksByStatus[activeSummaryKey] || []
  }, [activeSummaryKey, tasksByStatus])

  const activeSummaryTitle = useMemo(() => {
    if (!activeSummaryKey) return ''

    return (
      summaryCards.find((card) => card.key === activeSummaryKey)?.label || ''
    )
  }, [activeSummaryKey, summaryCards])

  const handleToggleSummary = (summaryKey: 'today' | 'urgent' | 'overdue') => {
    setActiveSummaryKey((current) =>
      current === summaryKey ? null : summaryKey
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="rounded-[28px] border border-[#E7EDF5] bg-white px-4 py-4 shadow-[0_18px_38px_rgba(20,41,82,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2F66C8] shadow-[0_8px_20px_rgba(47,102,200,0.10)]">
              <CalendarCheck2 size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[22px] font-bold tracking-tight text-[#142952]">
                Resumen del dia
              </h2>
              <p className="mt-1 text-[13px] text-[#6E7F9D]">
                Lo operativo que necesita tu atencion.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {summaryCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => handleToggleSummary(card.key)}
                className={`rounded-[22px] border px-2.5 py-2.5 text-left transition ${
                  card.tone
                } ${
                  activeSummaryKey === card.key
                    ? 'scale-[1.01] shadow-[0_12px_28px_rgba(20,41,82,0.12)]'
                    : 'shadow-[0_8px_22px_rgba(20,41,82,0.05)] hover:-translate-y-0.5'
                }`}
              >
                <div className="flex min-h-[64px] flex-col justify-between">
                  <p className="text-left text-[11px] font-bold leading-tight break-words">
                    {card.label}
                  </p>

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-inherit shadow-[0_8px_18px_rgba(20,41,82,0.08)]">
                      {card.icon}
                    </div>

                    <div className="h-8 w-px shrink-0 bg-current/15" />

                    <p className="text-[26px] font-bold leading-none">{card.value}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeSummaryKey ? (
          <div className="overflow-hidden rounded-[24px] border border-[#E3EAF3] bg-white shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F7] px-4 py-3">
              <div>
                <h3 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#7B86A8]">
                  {activeSummaryTitle}
                </h3>
                <p className="mt-1 text-xs text-[#8A97B0]">
                  {activeSummaryTasks.length}{' '}
                  {pluralize(
                    activeSummaryTasks.length,
                    'tarea en tus edificios',
                    'tareas en tus edificios'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSummaryKey(null)}
                className="rounded-full bg-[#F3F6FB] px-3 py-1.5 text-xs font-bold text-[#5E6E8C]"
              >
                Cerrar
              </button>
            </div>

            {activeSummaryTasks.length > 0 ? (
              <div className="divide-y divide-[#EEF2F7]">
                {activeSummaryTasks.map((task) => (
                  <HomeSummaryTaskRow
                    key={task.id}
                    task={task}
                    summaryKey={activeSummaryKey}
                    onOpenTask={onOpenTask}
                    onOpenBuilding={onOpenBuilding}
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-[#6E7F9D]">
                No hay tareas en esta vista.
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#142952]">
            Mis edificios
          </h2>
          <p className="mt-1 text-sm text-[#6E7F9D]">
            Tareas pendientes por edificio asignado.
          </p>
        </div>

        {buildings.map((building) => (
          <button
            key={building.id}
            type="button"
            onClick={() => onOpenBuilding(building.id)}
            className="w-full rounded-[28px] border border-[#E3EAF3] bg-white p-5 text-left shadow-[0_10px_28px_rgba(20,41,82,0.06)] transition hover:border-[#C7D8F5] hover:bg-[#FBFCFE]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2F66C8]">
                <Building2 size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-bold text-[#142952]">
                  {building.name}
                </h3>
                <p className="mt-1 truncate text-sm text-[#6E7F9D]">
                  {building.address || 'Sin direccion registrada'}
                </p>
              </div>

              <ChevronRight className="shrink-0 text-[#9AA8BF]" size={22} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#2F66C8]">
                <Wrench size={13} />
                {building.pendingCount}{' '}
                {pluralize(building.pendingCount, 'pendiente', 'pendientes')}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E0] px-3 py-1.5 text-xs font-bold text-[#B7791F]">
                <AlertTriangle size={13} />
                {building.urgentCount}{' '}
                {pluralize(building.urgentCount, 'urgente', 'urgentes')}
              </span>

              {building.todayCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8EF] px-3 py-1.5 text-xs font-bold text-[#177B52]">
                  <CalendarCheck2 size={13} />
                  {building.todayCount} hoy
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </section>
    </div>
  )
}

function HomeSummaryTaskRow({
  task,
  summaryKey,
  onOpenTask,
  onOpenBuilding,
}: {
  task: ConciergeHomeTask
  summaryKey: 'today' | 'urgent' | 'overdue'
  onOpenTask?: (
    buildingId: string,
    taskId: string,
    summaryKey: 'today' | 'urgent' | 'overdue'
  ) => void
  onOpenBuilding: (buildingId: string) => void
}) {
  const meta = [task.apartmentOrArea || 'Sin ubicacion', task.buildingName]
  const timeOrDate = task.taskTime?.trim()
    ? task.taskTime.slice(0, 5)
    : formatShortDate(task.taskDate)

  return (
    <button
      type="button"
      onClick={() => {
        if (onOpenTask) {
          onOpenTask(task.buildingId, task.id, summaryKey)
          return
        }

        onOpenBuilding(task.buildingId)
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#FBFCFE]"
    >
      <div
        className={`mt-0.5 h-10 w-1 shrink-0 rounded-full ${
          task.priority === 'high'
            ? 'bg-[#D64555]'
            : task.priority === 'medium'
              ? 'bg-[#D4A017]'
              : 'bg-[#2F66C8]'
        }`}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-bold text-[#142952]">
          {task.title}
        </p>
        <p className="mt-1 truncate text-sm text-[#6E7F9D]">
          {meta.join(' · ')}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-2">
        <span className="text-sm font-semibold text-[#7B86A8]">
          {timeOrDate}
        </span>
        <ChevronRight className="text-[#9AA8BF]" size={18} />
      </div>
    </button>
  )
}

function formatShortDate(date: string) {
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${day}/${month}`
}
