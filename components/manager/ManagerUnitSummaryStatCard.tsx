'use client'

import type { ReactNode } from 'react'

type ManagerUnitSummaryStatCardProps = {
  icon: ReactNode
  label: string
  value: string
  onClick?: () => void
  interactive?: boolean
  highlighted?: boolean
}

export default function ManagerUnitSummaryStatCard({
  icon,
  label,
  value,
  onClick,
  interactive = false,
  highlighted = false,
}: ManagerUnitSummaryStatCardProps) {
  const className = highlighted
    ? `rounded-[24px] border px-4 py-4 text-left shadow-[0_8px_24px_rgba(20,41,82,0.08)] transition ${
        interactive
          ? 'border-[#D6E5FF] bg-[#F5F9FF] hover:-translate-y-0.5 hover:border-[#BCD4FF] hover:bg-[#EEF5FF]'
          : 'border-[#D6E5FF] bg-[#F5F9FF]'
      }`
    : 'rounded-[24px] border border-[#E7EDF5] bg-white/70 px-4 py-4 text-left shadow-[0_8px_24px_rgba(20,41,82,0.03)] opacity-75'

  const iconTone = highlighted ? 'text-[#2F66C8]' : 'text-[#8C9AB3]'
  const labelTone = highlighted ? 'text-[#7B8BA8]' : 'text-[#A0ACC2]'
  const valueTone = highlighted ? 'text-[#142952]' : 'text-[#7B8BA8]'

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      className={className}
    >
      <div className={`flex items-center gap-2 ${iconTone}`}>
        {icon}
        <span className={`text-xs font-semibold uppercase tracking-wide ${labelTone}`}>
          {label}
        </span>
      </div>
      <p className={`mt-3 text-sm font-semibold leading-6 ${valueTone}`}>{value}</p>
    </button>
  )
}
