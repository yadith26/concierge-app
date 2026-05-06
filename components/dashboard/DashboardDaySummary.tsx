'use client'

import { useTranslations } from 'next-intl'

type Props = {
  todayCount: number
  urgentCount: number
  overdueCount: number
  showOverdueTasks: boolean
  onShowTodayTasks: () => void
  onToggleOverdueTasks: () => void
}

export default function DashboardDaySummary({
  todayCount,
  urgentCount,
  overdueCount,
  showOverdueTasks,
  onShowTodayTasks,
  onToggleOverdueTasks,
}: Props) {
  const t = useTranslations('dashboard.daySummary')

  const showingToday = !showOverdueTasks

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={onShowTodayTasks}
        className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
          showingToday
            ? 'border-[#DCE7F5] bg-white ring-1 ring-[#EAF2FF]'
            : 'border-[#E7EDF5] bg-white hover:bg-[#F8FAFE]'
        }`}
      >
        <p className="text-sm text-[#7B8BA8]">{t('todayTasks')}</p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-3xl font-bold leading-none text-[#142952]">
            {todayCount}
          </p>

          {urgentCount > 0 && (
            <div className="rounded-full bg-[#FFF4E8] px-3 py-1 text-sm font-semibold text-[#C65A17]">
              ⚠️ {urgentCount}
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-[#7B8BA8]">
          {showingToday ? t('showingToday') : t('tapToView')}
        </p>
      </button>

      <button
        type="button"
        onClick={onToggleOverdueTasks}
        className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
          showOverdueTasks
            ? 'border-[#F5D7B2] bg-[#FFF4E8]'
            : 'border-[#E7EDF5] bg-white hover:bg-[#FFF8F1]'
        }`}
      >
        <p className="text-sm text-[#7B8BA8]">{t('overdueTasks')}</p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold leading-none text-[#D64555]">
              {overdueCount}
            </p>

            <p className="mt-2 text-xs text-[#C65A17]">
              {showOverdueTasks ? t('showing') : t('tapToView')}
            </p>
          </div>

          <div className="text-2xl leading-none text-[#D64555]">
            {showOverdueTasks ? '−' : '+'}
          </div>
        </div>
      </button>
    </div>
  )
}