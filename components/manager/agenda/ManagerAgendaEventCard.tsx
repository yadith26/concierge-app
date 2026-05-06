'use client'

import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MapPin,
  Tag,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import TaskCardDetailRow from '@/components/tasks/task-card/TaskCardDetailRow'
import {
  getEventStatusLabel,
  getManagerAgendaCategoryLabel,
} from '@/lib/agenda/managerAgendaEventHelpers'
import type { AgendaEntry } from '@/components/manager/agenda/managerAgendaTypes'

type ManagerAgendaEventCardProps = {
  entry: AgendaEntry
  expanded: boolean
  onToggleExpand: () => void
}

export default function ManagerAgendaEventCard({
  entry,
  expanded,
  onToggleExpand,
}: ManagerAgendaEventCardProps) {
  const t = useTranslations('managerAgenda')
  const locale = useLocale()

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-[#FBFCFE] shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <button
        type="button"
        onClick={onToggleExpand}
        className="block w-full px-4 py-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F2EEFF] px-3 py-1 text-xs font-semibold text-[#7A4DE8]">
                {t('eventBadge')}
              </span>

              {entry.requestStatus ? (
                <span className="rounded-full bg-[#F3F6FB] px-3 py-1 text-xs font-semibold text-[#6E7F9D]">
                  {getEventStatusLabel(entry.requestStatus, t)}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm font-semibold text-[#142952]">
              {entry.title}
            </p>

            <p className="mt-1 text-sm text-[#6E7F9D]">
              {entry.apartment_or_area || t('noLocation')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right text-xs text-[#8C9AB3]">
              <p>{entry.task_time || t('allDay')}</p>
              <p className="mt-1">
                {getManagerAgendaCategoryLabel(entry.category, t)}
              </p>
            </div>

            {expanded ? (
              <ChevronDown size={16} className="text-[#8C9AB3]" />
            ) : (
              <ChevronRight size={16} className="text-[#8C9AB3]" />
            )}
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#EEF3F8] px-5 py-4">
            <div className="space-y-3">
              <TaskCardDetailRow
                icon={<NotebookIcon />}
                label={t('description')}
                value={entry.description?.trim() || t('noNote')}
              />

              <div className="grid grid-cols-2 gap-3">
                <TaskCardDetailRow
                  icon={<MapPin className="h-4 w-4" />}
                  label={t('location')}
                  value={entry.apartment_or_area || t('noLocation')}
                />
                <TaskCardDetailRow
                  icon={<Tag className="h-4 w-4" />}
                  label={t('category')}
                  value={getManagerAgendaCategoryLabel(entry.category, t)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TaskCardDetailRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label={t('dateLabel')}
                  value={new Date(`${entry.task_date}T12:00:00`).toLocaleDateString(
                    locale,
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  )}
                />
                <TaskCardDetailRow
                  icon={<ClipboardList className="h-4 w-4" />}
                  label={t('status')}
                  value={
                    entry.requestStatus
                      ? getEventStatusLabel(entry.requestStatus, t)
                      : t('pending')
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotebookIcon() {
  return <span className="text-[14px] leading-none">+</span>
}