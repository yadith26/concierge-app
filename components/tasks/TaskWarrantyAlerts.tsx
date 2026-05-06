'use client'

import { ShieldAlert } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatDateLong, getPestTargetKey } from '@/lib/tasks/taskLabels'
import type { PestTarget } from '@/lib/tasks/taskTypes'

type WarrantyAlertItem = {
  apartment_or_area: string
  pestTarget: PestTarget
  endDate: string
}

type TaskWarrantyAlertsProps = {
  category: string
  loading: boolean
  alerts: WarrantyAlertItem[]
}

export default function TaskWarrantyAlerts({
  category,
  loading,
  alerts,
}: TaskWarrantyAlertsProps) {
  const t = useTranslations('taskLabels')
  const warrantyT = useTranslations('taskWarrantyAlerts')
  const locale = useLocale()

  if (category !== 'pest') return null

  return (
    <>
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {warrantyT('activeWarrantyDetected')}
              </p>

              <div className="mt-2 space-y-1">
                {alerts.map((item, index) => (
                  <p
                    key={`${item.apartment_or_area}-${item.pestTarget}-${index}`}
                    className="text-sm text-amber-800"
                  >
                    {item.apartment_or_area}: {t(getPestTargetKey(item.pestTarget))}{' '}
                    {warrantyT('activeWarrantyUntil')}{' '}
                    {formatDateLong(item.endDate, locale)}
                  </p>
                ))}
              </div>

              <p className="mt-2 text-xs text-amber-700">
                {warrantyT('checkBeforeScheduling')}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-[#E7EDF5] bg-[#F8FAFE] px-4 py-3 text-sm text-[#6E7F9D]">
          {warrantyT('checkingActiveWarranty')}
        </div>
      )}
    </>
  )
}