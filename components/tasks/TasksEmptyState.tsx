'use client'

import { useTranslations } from 'next-intl'

type TasksEmptyStateProps = {
  message?: string
}

export default function TasksEmptyState({
  message,
}: TasksEmptyStateProps) {
  const t = useTranslations('tasksEmptyState')

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-6 py-10 text-center text-[#7B8BA8]">
        {message || t('defaultMessage')}
      </div>
    </div>
  )
}