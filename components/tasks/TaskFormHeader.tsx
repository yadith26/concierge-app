'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

type TaskFormHeaderProps = {
  isEditMode: boolean
  onClose: () => void
}

export default function TaskFormHeader({
  isEditMode,
  onClose,
}: TaskFormHeaderProps) {
  const t = useTranslations('taskFormHeader')

  return (
    <div className="sticky top-0 z-10 border-b border-[#E7EDF5] bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#142952]">
          {isEditMode ? t('editTitle') : t('createTitle')}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-[#6E7F9D] transition hover:bg-[#F8FAFE]"
          aria-label={t('close')}
        >
          <X size={22} />
        </button>
      </div>
    </div>
  )
}