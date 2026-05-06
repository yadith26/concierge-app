'use client'

import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'

type DashboardEmptyStateProps = {
  show: boolean
  onAction?: () => void
  isManager?: boolean
}

export default function DashboardEmptyState({
  show,
  onAction,
  isManager = false,
}: DashboardEmptyStateProps) {
  const t = useTranslations('dashboard.emptyState')

  if (!show) return null

  return (
    <div className="pt-5">
      <div className="rounded-[28px] border border-dashed border-[#D9E0EA] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
        
        <p className="text-[16px] font-semibold text-[#2E3A59]">
          {t('title')}
        </p>

        <p className="mt-2 text-sm text-[#7B8BA8]">
          {isManager
            ? t('managerDescription')
            : t('description')}
        </p>

        {!isManager && onAction && (
          <button
            onClick={onAction}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2F66C8] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
          >
            <Plus className="h-4 w-4" />
            {t('button')}
          </button>
        )}
      </div>
    </div>
  )
}