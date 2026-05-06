'use client'

import { useTranslations, useLocale } from 'next-intl'

type WarrantyBadgeProps = {
  isActive: boolean
  endDate: string | null
}

export default function WarrantyBadge({
  isActive,
  endDate,
}: WarrantyBadgeProps) {
  const t = useTranslations('warrantyBadge')
  const locale = useLocale()

  if (!endDate) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? 'bg-[#EAF7F0] text-[#177B52]'
          : 'bg-[#F4F6FA] text-[#7B8BA8]'
      }`}
    >
      {isActive ? t('active') : t('expired')}
      <span className="opacity-80">
        {' '}
        {t('until')} {formatDateShort(endDate, locale)}
      </span>
    </span>
  )
}

function formatDateShort(date: string, locale: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}