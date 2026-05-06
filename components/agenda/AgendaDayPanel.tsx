'use client'

import { useTranslations } from 'next-intl'
import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import TaskCard from '@/components/tasks/TaskCard'
import AgendaTaskGroupSection from '@/components/agenda/AgendaTaskGroupSection'
import type {
  GroupedAgendaTasks,
  AgendaTask,
} from '@/components/agenda/AgendaTypes'

type AgendaDayPanelProps = {
  selectedDate: string | null
  selectedDateLabel: string
  selectedStats: {
    pending: number
    timed: number
    urgent: number
  }
  tasksForDay: AgendaTask[]
  groupedTasks: GroupedAgendaTasks
  expandedTaskId: string | null
  setExpandedTaskId: Dispatch<SetStateAction<string | null>>
  onComplete: (taskId: string) => void
  onSwipeComplete?: (taskId: string) => void
  onSetInProgress: (taskId: string) => void
  onSetPending: (taskId: string) => void
  onDelete: (taskId: string) => void
  onEdit: (task: AgendaTask) => void
  onCreateTask: () => void
  animDirection: number
}

export default function AgendaDayPanel({
  selectedDate,
  selectedDateLabel,
  selectedStats,
  tasksForDay,
  groupedTasks,
  expandedTaskId,
  setExpandedTaskId,
  onComplete,
  onSwipeComplete,
  onSetInProgress,
  onSetPending,
  onDelete,
  onEdit,
  onCreateTask,
  animDirection,
}: AgendaDayPanelProps) {
  const t = useTranslations('agendaDayPanel')

  if (!selectedDate) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#D8E2F0] bg-[#F9FBFE] px-5 py-8 text-center">
        <p className="text-base font-medium text-[#142952]">
          {t('selectDay')}
        </p>
        <p className="mt-1 text-sm text-[#7B8BA8]">
          {t('createHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="flex items-center justify-between px-5 py-5">
        <div>
          <p className="text-sm capitalize text-[#6E7F9D]">
            {selectedDateLabel}
          </p>
          <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#142952]">
            {t('title')}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-sm text-[#6E7F9D]">
            {t('pending', { count: selectedStats.pending })}
          </p>
          <p className="text-sm text-[#6E7F9D]">
            {t('timed', { count: selectedStats.timed })}
          </p>
          <p className="text-sm text-[#6E7F9D]">
            {t('urgent', { count: selectedStats.urgent })}
          </p>
        </div>
      </div>

      <div className="mx-5 border-t border-[#E8EEF6]" />

      <div className="px-5 py-5">
        <AnimatePresence mode="wait" custom={animDirection}>
          <motion.div
            key={selectedDate}
            custom={animDirection}
            initial={{ opacity: 0, x: animDirection > 0 ? 26 : -26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: animDirection > 0 ? -20 : 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {tasksForDay.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#D8E2F0] bg-[#F9FBFE] px-5 py-10 text-center">
                <p className="text-base font-medium text-[#142952]">
                  {t('empty')}
                </p>
                <p className="mt-1 text-sm text-[#7B8BA8]">
                  {t('emptyHint')}
                </p>

                <button
                  type="button"
                  onClick={onCreateTask}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#3E63E6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(62,99,230,0.22)] hover:bg-[#3558D8]"
                >
                  <Plus className="h-4 w-4" />
                  {t('createForDay')}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedTasks.timed.length > 0 && (
                  <AgendaTaskGroupSection
                    title={t('withTime')}
                    count={groupedTasks.timed.length}
                  >
                    <div className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                      {groupedTasks.timed.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          expanded={expandedTaskId === task.id}
                          embedded
                          showDivider={index < groupedTasks.timed.length - 1}
                          onToggleExpand={() =>
                            setExpandedTaskId((prev) =>
                              prev === task.id ? null : task.id
                            )
                          }
                          onComplete={() => onComplete(task.id)}
                          onSwipeComplete={() => (onSwipeComplete || onComplete)(task.id)}
                          onSetInProgress={() => onSetInProgress(task.id)}
                          onSetPending={() => onSetPending(task.id)}
                          onDelete={() => onDelete(task.id)}
                          onEdit={() => onEdit(task)}
                        />
                      ))}
                    </div>
                  </AgendaTaskGroupSection>
                )}

                {groupedTasks.untimed.length > 0 && (
                  <AgendaTaskGroupSection
                    title={t('noTime')}
                    count={groupedTasks.untimed.length}
                  >
                    <div className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                      {groupedTasks.untimed.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          expanded={expandedTaskId === task.id}
                          embedded
                          showDivider={index < groupedTasks.untimed.length - 1}
                          onToggleExpand={() =>
                            setExpandedTaskId((prev) =>
                              prev === task.id ? null : task.id
                            )
                          }
                          onComplete={() => onComplete(task.id)}
                          onSwipeComplete={() => (onSwipeComplete || onComplete)(task.id)}
                          onSetInProgress={() => onSetInProgress(task.id)}
                          onSetPending={() => onSetPending(task.id)}
                          onDelete={() => onDelete(task.id)}
                          onEdit={() => onEdit(task)}
                        />
                      ))}
                    </div>
                  </AgendaTaskGroupSection>
                )}

                {groupedTasks.completed.length > 0 && (
                  <AgendaTaskGroupSection
                    title={t('completed')}
                    count={groupedTasks.completed.length}
                  >
                    <div className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                      {groupedTasks.completed.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          expanded={expandedTaskId === task.id}
                          embedded
                          showDivider={index < groupedTasks.completed.length - 1}
                          onToggleExpand={() =>
                            setExpandedTaskId((prev) =>
                              prev === task.id ? null : task.id
                            )
                          }
                          onComplete={() => onComplete(task.id)}
                          onSwipeComplete={() => (onSwipeComplete || onComplete)(task.id)}
                          onSetInProgress={() => onSetInProgress(task.id)}
                          onSetPending={() => onSetPending(task.id)}
                          onDelete={() => onDelete(task.id)}
                          onEdit={() => onEdit(task)}
                        />
                      ))}
                    </div>
                  </AgendaTaskGroupSection>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
