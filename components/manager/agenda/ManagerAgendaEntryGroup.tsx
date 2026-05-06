'use client'

import type { ReactNode } from 'react'
import { ClipboardList } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Task } from '@/lib/tasks/taskTypes'
import type { AgendaEntry } from '@/components/manager/agenda/managerAgendaTypes'
import ManagerAgendaReadonlyTaskCard from '@/components/manager/agenda/ManagerAgendaReadonlyTaskCard'
import ManagerAgendaEventCard from '@/components/manager/agenda/ManagerAgendaEventCard'

type ManagerAgendaEntryGroupProps = {
  title: string
  icon: ReactNode
  emptyText: string
  entries: AgendaEntry[]
  expandedTaskId: string | null
  expandedEventId: string | null
  onToggleTask: (taskId: string) => void
  onToggleEvent: (eventId: string) => void
}

export default function ManagerAgendaEntryGroup({
  title,
  icon,
  emptyText,
  entries,
  expandedTaskId,
  expandedEventId,
  onToggleTask,
  onToggleEvent,
}: ManagerAgendaEntryGroupProps) {
  const t = useTranslations('managerAgenda')

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#142952]">
        <span className="text-[#2F66C8]">{icon}</span>
        {title}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#D9E0EA] bg-[#F9FBFE] px-5 py-8 text-center">
          <div className="mb-3 flex justify-center">
            <ClipboardList className="h-6 w-6 text-[#9AA8C3]" />
          </div>

          <p className="text-[15px] font-semibold text-[#2E3A59]">
            {emptyText || t('emptyDayTasks')}
          </p>

          <p className="mt-1 text-sm text-[#7B8BA8]">
            {t('emptySectionDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) =>
            entry.entryType === 'task' ? (
              <ManagerAgendaReadonlyTaskCard
                key={entry.id}
                task={entry as Task}
                expanded={expandedTaskId === entry.id}
                onToggleExpand={() => onToggleTask(entry.id)}
              />
            ) : (
              <ManagerAgendaEventCard
                key={entry.id}
                entry={entry}
                expanded={expandedEventId === entry.id}
                onToggleExpand={() => onToggleEvent(entry.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}