'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AgendaTask } from '@/components/agenda/AgendaTypes'

type AgendaQuickViewProps = {
  selectedDate: string | null
  quickViewStats: {
    total: number
    active: number
    completed: number
  }
  quickViewTasks: AgendaTask[]
  onCreateTask: () => void
}

export default function AgendaQuickView({
  selectedDate,
  quickViewStats,
}: AgendaQuickViewProps) {
  const t = useTranslations('agendaQuickView')

  if (!selectedDate) return null
  if (quickViewStats.total === 0) return null

  return (
    <div className="rounded-[22px] border border-[#E7EDF5] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2F66C8]" />
            <p className="text-sm font-semibold text-[#142952]">
              {t('title')}
            </p>
          </div>

          <p className="mt-1 text-sm text-[#6E7F9D]">
            {t('total', { count: quickViewStats.total })}
          </p>
        </div>

        <div className="text-right text-xs text-[#7B8BA8]">
          <p>{t('active', { count: quickViewStats.active })}</p>
          <p>{t('completed', { count: quickViewStats.completed })}</p>
        </div>
      </div>
    </div>
  )
}