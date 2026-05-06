'use client'

import { Calendar, Clock3 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type TaskDateTimeFieldsProps = {
  taskDate: string
  taskTime: string
  minDate: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
}

export default function TaskDateTimeFields({
  taskDate,
  taskTime,
  minDate,
  onDateChange,
  onTimeChange,
}: TaskDateTimeFieldsProps) {
  const t = useTranslations('taskDateTimeFields')

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {t('date')}
        </label>

        <div className="relative">
          <input
            type="date"
            value={taskDate}
            min={minDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 pr-11 text-base text-[#142952] outline-none transition focus:border-[#BCD1F3] focus:ring-2 focus:ring-[#EAF2FF]"
          />

          <Calendar className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8C9AB3]" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {t('time')}
        </label>

        <div className="relative">
          <input
            type="time"
            value={taskTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 pr-11 text-base text-[#142952] outline-none transition focus:border-[#BCD1F3] focus:ring-2 focus:ring-[#EAF2FF]"
          />

          <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8C9AB3]" />
        </div>
      </div>
    </div>
  )
}