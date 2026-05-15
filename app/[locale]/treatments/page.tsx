'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import BottomNav from '@/components/layout/BottomNav'
import ConciergePageShell from '@/components/layout/ConciergePageShell'
import TreatmentsPageContent from '@/components/treatments/TreatmentsPageContent'
import TreatmentsPageHeader from '@/components/treatments/TreatmentsPageHeader'
import TreatmentsPageModals from '@/components/treatments/TreatmentsPageModals'
import { usePestFilters } from '@/hooks/usePestFilters'
import { usePestPage } from '@/hooks/usePestPage'
import { useTaskReopenReason } from '@/hooks/useTaskReopenReason'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type {
  EditableTask,
  PestTarget,
  TaskDraft,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

type TreatmentsTab = 'scheduled' | 'history'

export default function TreatmentsPage() {
  const t = useTranslations('treatmentsPage')
  const reopenReasonT = useTranslations('taskStatusReasonModal')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const selectedBuildingId = searchParams.get('buildingId')
  const headerConversation = useHeaderConversation({
    preferredBuildingId: selectedBuildingId || undefined,
  })
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<TreatmentsTab>('scheduled')
  const [search, setSearch] = useState('')
  const [pestFilter, setPestFilter] = useState<'all' | PestTarget>('all')
  const [visitFilter, setVisitFilter] = useState<'all' | TreatmentVisitType>('all')

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [expandedApartment, setExpandedApartment] = useState<string | null>(null)
  const [expandedPestKey, setExpandedPestKey] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<EditableTask | null>(null)
  const [resultMessage, setResultMessage] = useState('')

  const {
    tasks,
    treatments,
    buildingName,
    buildings,
    buildingId,
    profileId,
    loading,
    fetchTreatmentsData,
    updateTaskStatus,
    deleteScheduledTask,
    deleteHistoryRecord,
    exportHistoryToExcel,
  } = usePestPage(selectedBuildingId)
  const reopenReason = useTaskReopenReason({
    requiredMessage: reopenReasonT('required'),
    failedMessage: reopenReasonT('failed'),
  })

  const { scheduledTasks, filteredTreatments, groupedTreatments } =
    usePestFilters({
      tasks,
      treatments,
      search,
      pestFilter,
      visitFilter,
    })

  const ownerRequests = useOwnerRequestsInbox(buildingId)
  const scrollElementRef = useRef<HTMLElement | null>(null)
  const { scrollRef, compactHeader } = useCompactHeader()

  useSyncConciergeBuildingUrl({
    buildingId,
    path: '/treatments',
    selectedBuildingId,
  })
  const setScrollContainer = useCallback(
    (node: HTMLElement | null) => {
      scrollElementRef.current = node
      scrollRef(node)
    },
    [scrollRef]
  )

  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTo({
        top: 0,
        behavior: 'auto',
      })
    }
  }, [activeTab])

  const handleChangeTab = (tab: TreatmentsTab) => {
    setActiveTab(tab)
    setExpandedTaskId(null)
    setExpandedApartment(null)
    setExpandedPestKey(null)
  }

  const handleSetPendingTask = (task: EditableTask) => {
    if (task.status === 'completed') {
      reopenReason.requestReopen({
        taskTitle: task.title,
        onConfirm: (reason) => updateTaskStatus(task.id, 'pending', reason),
      })
      return
    }

    void updateTaskStatus(task.id, 'pending')
  }

  return (
    <>
      <ConciergePageShell
        loading={loading}
        loadingLabel={t('loading')}
        bottomNav={<BottomNav active="treatments" buildingId={buildingId} />}
      >
        <TreatmentsPageHeader
          compact={compactHeader}
          activeTab={activeTab}
          buildingId={buildingId}
          buildingName={buildingName}
          buildings={buildings}
          filteredTreatments={filteredTreatments}
          canOpenConversation={headerConversation.canOpenConversation}
          unreadMessageCount={headerConversation.unreadCount}
          ownerRequestsOpenCount={ownerRequests.openCount}
          ownerRequestsUnreadCount={ownerRequests.unreadCount}
          onOpenConversationInbox={() => {
            void headerConversation.openInbox()
          }}
          onOpenOwnerRequests={() => {
            void ownerRequests.openModal()
          }}
          onOpenCreateTreatment={() => {
            setSelectedTask(null)
            setModalOpen(true)
          }}
          onExportHistory={exportHistoryToExcel}
        />

        <TreatmentsPageContent
          scrollRef={setScrollContainer}
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          search={search}
          setSearch={setSearch}
          pestFilter={pestFilter}
          setPestFilter={setPestFilter}
          visitFilter={visitFilter}
          setVisitFilter={setVisitFilter}
          resultMessage={resultMessage}
          scheduledTasks={scheduledTasks}
          groupedTreatments={groupedTreatments}
          expandedTaskId={expandedTaskId}
          setExpandedTaskId={setExpandedTaskId}
          expandedApartment={expandedApartment}
          expandedPestKey={expandedPestKey}
          setExpandedApartment={setExpandedApartment}
          setExpandedPestKey={setExpandedPestKey}
          emptyScheduledText={t('emptyScheduled')}
          emptyHistoryText={t('emptyHistory')}
          onUpdateTaskStatus={updateTaskStatus}
          onSetPendingTask={handleSetPendingTask}
          onDeleteScheduledTask={deleteScheduledTask}
          onEditTask={(task) => {
            setSelectedTask(task)
            setModalOpen(true)
          }}
          onDeleteHistoryRecord={deleteHistoryRecord}
        />
      </ConciergePageShell>

      <TreatmentsPageModals
        headerConversation={headerConversation}
        ownerRequests={ownerRequests}
        reopenReason={reopenReason}
        modalOpen={modalOpen}
        selectedTask={selectedTask}
        requestTaskDraft={requestTaskDraft}
        requestSourceId={requestSourceId}
        buildingId={buildingId}
        profileId={profileId}
        onSaveMessageAsTask={(message) => {
          setSelectedTask(null)
          setRequestTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setRequestSourceId(null)
          headerConversation.closeConversation()
          setModalOpen(true)
        }}
        onConvertOwnerRequest={(request) => {
          setRequestTaskDraft(ownerRequests.toTaskDraft(request))
          setRequestSourceId(request.id)
          ownerRequests.closeModal()
          setSelectedTask(null)
          setModalOpen(true)
        }}
        onCloseTaskModal={() => {
          setModalOpen(false)
          setSelectedTask(null)
          setRequestTaskDraft(null)
          setRequestSourceId(null)
        }}
        onResultMessage={setResultMessage}
        onCreated={async () => {
          if (requestSourceId) {
            await ownerRequests.markConverted(requestSourceId)
          }
          await fetchTreatmentsData()
          await ownerRequests.reloadRequests()
        }}
      />
    </>
  )
}
