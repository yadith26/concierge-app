'use client'

import { CalendarDays, ClipboardList } from 'lucide-react'
import { useTranslations } from 'next-intl'
import ManagerAgendaEntryGroup from '@/components/manager/agenda/ManagerAgendaEntryGroup'
import type { AgendaEntry } from '@/components/manager/agenda/managerAgendaTypes'

type ManagerAgendaDayPanelProps = {
  selectedDate: string | null
  selectedTasks: AgendaEntry[]
  selectedEvents: AgendaEntry[]
  expandedTaskId: string | null
  expandedEventId: string | null
  onToggleTask: (taskId: string) => void
  onToggleEvent: (eventId: string) => void
}

export default function ManagerAgendaDayPanel({
  selectedDate,
  selectedTasks,
  selectedEvents,
  expandedTaskId,
  expandedEventId,
  onToggleTask,
  onToggleEvent,
}: ManagerAgendaDayPanelProps) {
  const t = useTranslations('managerAgenda')

  return (
    <section className="mt-4 rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm capitalize text-[#6E7F9D]">
            {selectedDate || t('pickDay')}
          </p>
          <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#142952]">
            {t('dayEvents')}
          </h2>
        </div>

        <div className="text-right text-sm text-[#6E7F9D]">
          <p>{t('tasksCount', { count: selectedTasks.length })}</p>
          <p>{t('eventsCount', { count: selectedEvents.length })}</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <ManagerAgendaEntryGroup
          title={t('conciergeTasks')}
          icon={<ClipboardList size={16} />}
          emptyText={t('emptyDayTasks')}
          entries={selectedTasks}
          expandedTaskId={expandedTaskId}
          expandedEventId={expandedEventId}
          onToggleTask={onToggleTask}
          onToggleEvent={onToggleEvent}
        />

        {selectedEvents.length > 0 ? (
          <ManagerAgendaEntryGroup
            title={t('events')}
            icon={<CalendarDays size={16} />}
            emptyText=""
            entries={selectedEvents}
            expandedTaskId={expandedTaskId}
            expandedEventId={expandedEventId}
            onToggleTask={onToggleTask}
            onToggleEvent={onToggleEvent}
          />
        ) : null}
      </div>
    </section>
  )
}