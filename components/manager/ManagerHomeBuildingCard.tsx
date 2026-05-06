'use client'

import { Building2, ChevronRight, ClipboardList, Wrench } from 'lucide-react'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'

type ManagerHomeBuildingCardProps = {
  building: BuildingSummary
  conciergeTodayTasks: number
  managerOpenTasks: number
  onOpen: () => void
}

export default function ManagerHomeBuildingCard({
  building,
  conciergeTodayTasks,
  managerOpenTasks,
  onOpen,
}: ManagerHomeBuildingCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[24px] border border-[#E3EAF3] bg-white p-5 text-left shadow-[0_10px_28px_rgba(20,41,82,0.06)] transition hover:border-[#C7D8F5] hover:bg-[#FBFCFE]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[24px] bg-[#EEF4FF] text-[#2F66C8]">
          <Building2 size={34} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[22px] font-bold text-[#142952]">
            {building.name}
          </h2>
          <p className="mt-1 truncate text-[15px] text-[#6E7F9D]">
            {building.address || 'Sin direccion registrada'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MetricPill
              icon={<Wrench size={16} />}
              label="hoy conserje"
              value={conciergeTodayTasks}
              tone="blue"
            />
            <MetricPill
              icon={<ClipboardList size={16} />}
              label={managerOpenTasks === 1 ? 'tarea tuya' : 'tareas tuyas'}
              value={managerOpenTasks}
              tone="red"
            />
          </div>
        </div>

        <ChevronRight className="shrink-0 text-[#142952]" size={24} />
      </div>
    </button>
  )
}

function MetricPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'blue' | 'red'
}) {
  const styles = {
    blue: 'bg-[#EEF4FF] text-[#2F66C8]',
    red: 'bg-[#FFF0ED] text-[#A43A33]',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${styles[tone]}`}
    >
      {icon}
      {value} {label}
    </span>
  )
}
