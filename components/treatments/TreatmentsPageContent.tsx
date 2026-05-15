'use client'

import PestHistorySection from '@/components/treatments/PestHistorySection'
import TreatmentsFilters from '@/components/treatments/TreatmentsFilters'
import TaskCard from '@/components/tasks/TaskCard'
import { toEditableTask } from '@/lib/tasks/taskHelpers'
import type { ApartmentHistorySummary } from '@/lib/tasks/pestHistoryHelpers'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'
import type {
  EditableTask,
  PestTarget,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

type TreatmentsTab = 'scheduled' | 'history'

type TreatmentsPageContentProps = {
  scrollRef: (node: HTMLElement | null) => void
  activeTab: TreatmentsTab
  onChangeTab: (tab: TreatmentsTab) => void
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  pestFilter: 'all' | PestTarget
  setPestFilter: React.Dispatch<React.SetStateAction<'all' | PestTarget>>
  visitFilter: 'all' | TreatmentVisitType
  setVisitFilter: React.Dispatch<
    React.SetStateAction<'all' | TreatmentVisitType>
  >
  resultMessage: string
  scheduledTasks: EditableTask[]
  groupedTreatments: ApartmentHistorySummary<PestTreatmentRow>[]
  expandedTaskId: string | null
  setExpandedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  expandedApartment: string | null
  expandedPestKey: string | null
  setExpandedApartment: React.Dispatch<React.SetStateAction<string | null>>
  setExpandedPestKey: React.Dispatch<React.SetStateAction<string | null>>
  emptyScheduledText: string
  emptyHistoryText: string
  onUpdateTaskStatus: (
    taskId: string,
    status: EditableTask['status']
  ) => Promise<boolean | void>
  onSetPendingTask: (task: EditableTask) => void
  onDeleteScheduledTask: (taskId: string) => void
  onEditTask: (task: EditableTask) => void
  onDeleteHistoryRecord: (recordId: string) => void
}

export default function TreatmentsPageContent({
  scrollRef,
  activeTab,
  onChangeTab,
  search,
  setSearch,
  pestFilter,
  setPestFilter,
  visitFilter,
  setVisitFilter,
  resultMessage,
  scheduledTasks,
  groupedTreatments,
  expandedTaskId,
  setExpandedTaskId,
  expandedApartment,
  expandedPestKey,
  setExpandedApartment,
  setExpandedPestKey,
  emptyScheduledText,
  emptyHistoryText,
  onUpdateTaskStatus,
  onSetPendingTask,
  onDeleteScheduledTask,
  onEditTask,
  onDeleteHistoryRecord,
}: TreatmentsPageContentProps) {
  return (
    <section
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-3"
    >
      <div className="space-y-3">
        {resultMessage ? (
          <div className="rounded-[20px] border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-3 text-sm font-medium text-[#2F66C8] shadow-[0_8px_24px_rgba(47,102,200,0.08)]">
            {resultMessage}
          </div>
        ) : null}

        <TreatmentsFilters
          activeTab={activeTab}
          setActiveTab={onChangeTab}
          search={search}
          setSearch={setSearch}
          pestFilter={pestFilter}
          setPestFilter={setPestFilter}
          visitFilter={visitFilter}
          setVisitFilter={setVisitFilter}
        />

        {activeTab === 'scheduled' ? (
          scheduledTasks.length === 0 ? (
            <EmptyState text={emptyScheduledText} />
          ) : (
            <div className="space-y-3">
              {scheduledTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  expanded={expandedTaskId === task.id}
                  onToggleExpand={() =>
                    setExpandedTaskId((prev) =>
                      prev === task.id ? null : task.id
                    )
                  }
                  onComplete={() => onUpdateTaskStatus(task.id, 'completed')}
                  onSetInProgress={() =>
                    onUpdateTaskStatus(task.id, 'in_progress')
                  }
                  onSetPending={() => onSetPendingTask(task)}
                  onDelete={() => onDeleteScheduledTask(task.id)}
                  onEdit={() => onEditTask(toEditableTask(task))}
                />
              ))}
            </div>
          )
        ) : groupedTreatments.length === 0 ? (
          <EmptyState text={emptyHistoryText} />
        ) : (
          <PestHistorySection
            groupedTreatments={groupedTreatments}
            expandedApartment={expandedApartment}
            expandedPestKey={expandedPestKey}
            setExpandedApartment={setExpandedApartment}
            setExpandedPestKey={setExpandedPestKey}
            onDeleteHistoryRecord={onDeleteHistoryRecord}
          />
        )}
      </div>
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-6 py-10 text-center text-[#7B8BA8]">{text}</div>
    </div>
  )
}
