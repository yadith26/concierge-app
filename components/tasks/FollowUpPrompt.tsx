'use client'

import { ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

type FollowUpPromptProps = {
  open: boolean
  loading?: boolean
  onConfirm: () => void
  onSkip: () => void
}

export default function FollowUpPrompt({
  open,
  loading = false,
  onConfirm,
  onSkip,
}: FollowUpPromptProps) {
  const t = useTranslations('followUpPrompt')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-[28px] border border-[#E7EDF5] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#EEF4FF] p-3 text-[#2F66C8]">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#142952]">{t('title')}</h3>
              <p className="mt-1 text-sm text-[#6E7F9D]">{t('subtitle')}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#F8FAFE] px-4 py-4 text-sm text-[#5E6E8C]">
            {t('description')}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="flex-1 rounded-2xl border border-[#E7EDF5] bg-white px-4 py-3 text-base font-semibold text-[#5E6E8C] transition hover:bg-[#F8FAFE] disabled:opacity-60"
            >
              {t('skip')}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded-2xl bg-[#2F66C8] px-4 py-3 text-base font-semibold text-white shadow-[0_12px_30px_rgba(47,102,200,0.22)] transition hover:bg-[#2859B2] disabled:opacity-60"
            >
              {loading ? t('creating') : t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
