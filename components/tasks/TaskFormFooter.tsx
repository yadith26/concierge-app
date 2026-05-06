'use client'

import { useTranslations } from 'next-intl'

type TaskFormFooterProps = {
  isEditMode: boolean
  saving: boolean
  onCancel: () => void
}

export default function TaskFormFooter({
  isEditMode,
  saving,
  onCancel,
}: TaskFormFooterProps) {
  const t = useTranslations('taskFormFooter')

  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base font-semibold text-[#5E6E8C] transition hover:bg-[#F8FAFE]"
      >
        {t('cancel')}
      </button>

      <button
        type="submit"
        disabled={saving}
        className="flex-1 rounded-2xl bg-[#2F66C8] px-4 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(47,102,200,0.22)] transition hover:bg-[#2859B2] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving
          ? isEditMode
            ? t('updating')
            : t('saving')
          : isEditMode
            ? t('updateTask')
            : t('saveTask')}
      </button>
    </div>
  )
}