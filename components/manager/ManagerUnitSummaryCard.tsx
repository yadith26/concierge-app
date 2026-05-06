'use client'

import type { ReactNode } from 'react'
import { ChevronRight, History } from 'lucide-react'
import type { UnitCardSummary } from '@/lib/unit-history/unitsWorkbook'

type ManagerUnitSummaryCardProps = {
  unit: UnitCardSummary
  icon: ReactNode
}

export default function ManagerUnitSummaryCard({
  unit,
  icon,
}: ManagerUnitSummaryCardProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-sm font-semibold text-[#2F66C8]">
          <History size={14} />
          {unit.totalEvents} {unit.totalEvents === 1 ? 'record' : 'records'}
        </span>

        <h2 className="mt-4 text-[22px] font-bold leading-none text-[#142952]">
          {unit.unitLabel}
        </h2>

        <p className="mt-3 text-sm font-medium text-[#142952]">
          {unit.lastEventTitle}
        </p>
        <p className="mt-1 text-sm text-[#7B8BA8]">
          {new Date(`${unit.lastEventDate}T12:00:00`).toLocaleDateString('en-CA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-[#8C9AB3]">
        <span className="rounded-full bg-[#F3F6FB] p-2">{icon}</span>
        <ChevronRight size={18} />
      </div>
    </div>
  )
}
