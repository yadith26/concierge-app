'use client'

import { useTranslations } from 'next-intl'

type Props = {
  todayCount: number
  urgentCount: number
  overdueCount: number
  onPress?: () => void
}

export default function DashboardTodaySummary({
  todayCount,
  urgentCount,
  overdueCount,
  onPress,
}: Props) {
  const t = useTranslations('dashboardTodaySummary')

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full rounded-[24px] bg-gradient-to-br from-[#4B63DF] to-[#6E8BFF] px-5 py-4 text-left shadow-[0_16px_32px_rgba(75,99,223,0.25)] active:scale-[0.99]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/80">
        {t('today')}
      </p>

      <p className="mt-1 text-[24px] font-bold leading-tight text-white">
        {t('pendingTasks', { count: todayCount })}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {urgentCount > 0 && (
          <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white">
            {t('urgentTasks', { count: urgentCount })}
          </span>
        )}

        {overdueCount > 0 && (
          <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white">
            {t('overdueTasks', { count: overdueCount })}
          </span>
        )}
      </div>
    </button>
  )
}
