'use client'

import { ChevronRight, Clock3 } from 'lucide-react'

type TaskStatusSummaryCardProps = {
  count: number
  title: string
  subtitle: string
  onClick: () => void
  active?: boolean
}

export default function TaskStatusSummaryCard({
  count,
  title,
  subtitle,
  onClick,
  active = false,
}: TaskStatusSummaryCardProps) {
  if (count <= 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[22px] px-5 py-2 text-left shadow-[0_8px_24px_rgba(20,41,82,0.04)] transition hover:translate-y-[-1px] ${
        active
          ? 'border border-[#F5D9A8] bg-[#FFF7EA]'
          : 'border border-[#F5E3C4] bg-[#FFFBF4]'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E3A53A] text-white">
          <Clock3 className="h-5 w-5" />
        </span>

        <div>
          <p className="text-[18px] font-bold text-[#C98717]">{count}</p>
          <p className="text-[15px] font-medium text-[#2D3B5B]">{title}</p>
          <p className="mt-1 text-sm text-[#7B8BA8]">{subtitle}</p>
        </div>
      </div>

      <ChevronRight size={20} className="text-[#7B86A8]" />
    </button>
  )
}
