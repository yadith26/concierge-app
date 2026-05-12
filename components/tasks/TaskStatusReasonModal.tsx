'use client'

import { AlertCircle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

type TaskStatusReasonModalProps = {
  open: boolean
  taskTitle: string
  reason: string
  error?: string | null
  saving?: boolean
  onChangeReason: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function TaskStatusReasonModal({
  open,
  taskTitle,
  reason,
  error,
  saving = false,
  onChangeReason,
  onClose,
  onConfirm,
}: TaskStatusReasonModalProps) {
  const t = useTranslations('taskStatusReasonModal')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-end sm:items-center">
        <div className="w-full rounded-t-[32px] bg-white px-5 pb-6 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:rounded-[32px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C9AB3]">
                {t('eyebrow')}
              </p>
              <h2 className="mt-2 text-[22px] font-bold text-[#142952]">
                {t('title')}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#E2E8F0] p-3 text-[#6E7F9D] hover:bg-[#F8FAFE]"
              aria-label={t('close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#F6D7DB] bg-[#FFF5F6] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFECEF] text-[#D64555]">
                <AlertCircle size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#142952]">
                  {taskTitle}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#5E6E8C]">
                  {t('description')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="task-reopen-reason"
              className="mb-2 block text-sm font-semibold text-[#5E6E8C]"
            >
              {t('label')}
            </label>

            <textarea
              id="task-reopen-reason"
              value={reason}
              onChange={(event) => onChangeReason(event.target.value)}
              placeholder={t('placeholder')}
              rows={4}
              className="w-full rounded-[22px] border border-[#DCE7F5] px-4 py-3 text-sm text-[#142952] outline-none transition placeholder:text-[#9AA8C0] focus:border-[#AFC8FF] focus:ring-2 focus:ring-[#D9E8FF]"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[22px] border border-[#DCE7F5] px-4 py-4 text-sm font-semibold text-[#6E7F9D] hover:bg-[#F8FAFE]"
            >
              {t('cancel')}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onConfirm}
              className="flex-1 rounded-[22px] bg-[#2F66C8] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.25)] hover:bg-[#2859B2] disabled:opacity-60"
            >
              {saving ? t('confirming') : t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
