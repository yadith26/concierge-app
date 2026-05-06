'use client'

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
} from 'lucide-react'
import type { ManagerEventSummary } from '@/lib/manager/managerDashboardTypes'

type EventChipTone = 'slate' | 'amber' | 'green' | 'red'

type ManagerDashboardEventsCardProps = {
  eventSummary: ManagerEventSummary
  onOpenAgenda: () => void
}

export default function ManagerDashboardEventsCard({
  eventSummary,
  onOpenAgenda,
}: ManagerDashboardEventsCardProps) {
  return (
    <button
      type="button"
      onClick={onOpenAgenda}
      className="mt-5 w-full rounded-[24px] border border-[#E7EDF5] bg-white px-4 py-4 text-left shadow-sm transition hover:border-[#C7D8F5] hover:bg-[#FBFCFE]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#142952]">
            <span className="text-[#2F66C8]">
              <CalendarDays size={18} />
            </span>
            Eventos del manager
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <InlineEventChip
              label="Pendientes"
              value={eventSummary.pending.length}
              tone="amber"
              icon={<Clock3 size={14} />}
            />
            <InlineEventChip
              label="Vistos"
              value={eventSummary.viewed.length}
              tone="slate"
              icon={<Eye size={14} />}
            />
            <InlineEventChip
              label="Convertidos"
              value={eventSummary.converted.length}
              tone="green"
              icon={<CheckCircle2 size={14} />}
            />
            <InlineEventChip
              label="Archivados"
              value={eventSummary.closed.length}
              tone="red"
              icon={<ClipboardList size={14} />}
            />
          </div>
        </div>

        <div className="shrink-0 text-right text-sm font-semibold text-[#2F66C8]">
          Ver agenda
        </div>
      </div>
    </button>
  )
}

function InlineEventChip({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: EventChipTone
  icon: React.ReactNode
}) {
  const styles = {
    slate: 'bg-[#EEF2F8] text-[#60739A]',
    amber: 'bg-[#FDF0C8] text-[#C97800]',
    green: 'bg-[#DDF3E6] text-[#0F8A4B]',
    red: 'bg-[#FDE2E4] text-[#C94A57]',
  }[tone]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${styles}`}
    >
      {icon}
      {label}: {value}
    </span>
  )
}
