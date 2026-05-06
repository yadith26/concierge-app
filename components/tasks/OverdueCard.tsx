'use client'

import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

type OverdueCardProps = {
  overdueCount: number
  onClick: () => void
}

export default function OverdueCard({
  overdueCount,
  onClick,
}: OverdueCardProps) {
  const t = useTranslations('overdueCard')

  if (overdueCount <= 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[22px] border border-[#F6DFC1] bg-[#FFF8F0] px-5 py-2 text-left shadow-[0_8px_24px_rgba(20,41,82,0.04)] transition hover:translate-y-[-1px]"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F59A23] text-white">
          <AlertTriangle className="h-5 w-5" />
        </span>

        <div>
          <p className="text-[18px] font-bold text-[#D9811E]">{overdueCount}</p>
          <p className="text-[15px] font-medium text-[#2D3B5B]">{t('title')}</p>
          <p className="mt-1 text-sm text-[#7B8BA8]">{t('tapToView')}</p>
        </div>
      </div>

      <ChevronRight size={20} className="text-[#7B86A8]" />
    </button>
  )
}
