'use client'

import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { AgendaDayItem } from '@/components/agenda/AgendaTypes'

type AgendaCalendarProps = {
  monthLabel: string
  monthlyStats?: {
    total: number
    completed: number
    urgent: number
  }
  days: AgendaDayItem[]
  selectedDate: string | null
  onChangeMonth: (direction: -1 | 1) => void
  onSelectDate: (date: string) => void
  onCreateTask: () => void
  onExportMonth: () => void
  exportLabel?: string
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void
}

export default function AgendaCalendar({
  monthLabel,
  monthlyStats = {
    total: 0,
    completed: 0,
    urgent: 0,
  },
  days,
  selectedDate,
  onChangeMonth,
  onSelectDate,
  onCreateTask,
  onExportMonth,
  exportLabel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: AgendaCalendarProps) {
  const locale = useLocale()
  const t = useTranslations('agendaCalendar')
  const firstDate = days[0]?.date ? new Date(`${days[0].date}T12:00:00`) : null
  const weekStartsOn = locale.startsWith('en') ? 0 : 1
  const leadingEmptyDays = firstDate
    ? (firstDate.getDay() - weekStartsOn + 7) % 7
    : 0
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const sunday = new Date('2026-04-05T12:00:00')
    sunday.setDate(sunday.getDate() + weekStartsOn + index)

    return sunday.toLocaleDateString(locale, { weekday: 'short' })
  })

  return (
    <div
      className="rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div className="px-5 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E7EDF5] bg-[#F9FBFE] text-[#142952] hover:bg-[#F3F7FD]"
            aria-label={t('previousMonth')}
          >
            <ChevronLeft size={22} />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <p className="truncate text-[18px] font-semibold capitalize text-[#142952]">
              {monthLabel}
            </p>

            <button
              type="button"
              onClick={onExportMonth}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8] hover:bg-[#E4EEFF] ${
                exportLabel ? 'px-3 text-xs font-bold' : 'w-9'
              }`}
              aria-label={t('export')}
              title={t('export')}
            >
              <Download size={16} />
              {exportLabel ? <span>{exportLabel}</span> : null}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChangeMonth(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E7EDF5] bg-[#F9FBFE] text-[#142952] hover:bg-[#F3F7FD]"
            aria-label={t('nextMonth')}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center gap-4 text-xs text-[#7B8BA8]">
          <span>{t('tasksThisMonth', { count: monthlyStats.total })}</span>
          <span>{t('completed', { count: monthlyStats.completed })}</span>
          <span className="text-[#D64555]">
            {t('urgent', { count: monthlyStats.urgent })}
          </span>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#8C9AB3]"
            >
              {label.replace('.', '')}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingEmptyDays }, (_, index) => (
            <div
              key={`empty-${index}`}
              aria-hidden="true"
              className="h-[58px]"
            />
          ))}

          {days.map((dayItem) => {
            const isSelected = selectedDate === dayItem.date

            return (
              <button
                key={dayItem.date}
                type="button"
                onClick={() => onSelectDate(dayItem.date)}
                onDoubleClick={() => {
                  onSelectDate(dayItem.date)
                  onCreateTask()
                }}
                className={`flex h-[58px] flex-col items-center justify-center rounded-[18px] border text-[16px] font-medium transition ${
                  isSelected
                    ? 'border-[#3E63E6] bg-[#3E63E6] text-white shadow-[0_10px_18px_rgba(62,99,230,0.28)]'
                    : dayItem.hasUrgent
                      ? 'border-[#F0D9DD] bg-[#FFF7F8] text-[#2C2F36] hover:bg-[#FFF2F4]'
                      : dayItem.isToday
                        ? 'border-[#AFC8F6] bg-[#F4F8FF] text-[#244A8F] shadow-[inset_0_0_0_1px_rgba(47,102,200,0.06)]'
                        : 'border-[#EEF3F8] bg-[#F4F6FA] text-[#2C2F36] hover:bg-[#EDF2F8]'
                }`}
              >
                <span>{dayItem.day}</span>

                <div className="mt-1 flex min-h-[6px] items-center gap-[3px]">
                  {dayItem.tones.high && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-white/90' : 'bg-[#D94B4B]'
                      }`}
                    />
                  )}
                  {dayItem.tones.medium && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-white/90' : 'bg-[#E2B93B]'
                      }`}
                    />
                  )}
                  {dayItem.tones.low && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-white/90' : 'bg-[#A0A7B4]'
                      }`}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
