'use client'

import { CalendarDays } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatTaskDateLong } from '@/lib/tasks/taskLabels'
import type { ExistingFollowUpDecisionItem } from '@/lib/tasks/followUpHelpers'

type FollowUpExistingDecisionModalProps = {
  open: boolean
  loading?: boolean
  items: ExistingFollowUpDecisionItem[]
  onKeep: () => void
  onReprogram: () => void
}

export default function FollowUpExistingDecisionModal({
  open,
  loading = false,
  items,
  onKeep,
  onReprogram,
}: FollowUpExistingDecisionModalProps) {
  const t = useTranslations('taskFollowUpDecision')
  const locale = useLocale()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/45 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-[28px] border border-[#E7EDF5] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#EEF4FF] p-3 text-[#2F66C8]">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#142952]">
                {t('title')}
              </h3>
              <p className="mt-1 text-sm text-[#6E7F9D]">
                {t('description')}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div
                key={`${item.taskId}-${item.apartment_or_area}`}
                className="rounded-2xl border border-[#E7EDF5] bg-[#F8FAFE] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[#142952]">
                  {item.apartment_or_area}
                </p>
                <p className="mt-1 text-sm text-[#5E6E8C]">
                  {t('currentDate')} {formatTaskDateLong(item.currentDate, locale)}
                </p>
                <p className="mt-1 text-sm text-[#5E6E8C]">
                  {t('suggestedDate')} {formatTaskDateLong(item.suggestedDate, locale)}
                </p>
                {!item.canReprogram ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    {t('cannotReprogram')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onKeep}
              disabled={loading}
              className="flex-1 rounded-2xl border border-[#E7EDF5] bg-white px-4 py-3 text-base font-semibold text-[#5E6E8C] transition hover:bg-[#F8FAFE] disabled:opacity-60"
            >
              {t('keep')}
            </button>

            <button
              type="button"
              onClick={onReprogram}
              disabled={loading || items.every((item) => !item.canReprogram)}
              className="flex-1 rounded-2xl bg-[#2F66C8] px-4 py-3 text-base font-semibold text-white shadow-[0_12px_30px_rgba(47,102,200,0.22)] transition hover:bg-[#2859B2] disabled:opacity-60"
            >
              {loading ? t('reprogramming') : t('reprogram')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
