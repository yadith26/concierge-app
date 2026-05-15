'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, Plus, MessageSquareMore, BellDot } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import PestHistorySection from '@/components/treatments/PestHistorySection'
import TreatmentsFilters from '@/components/treatments/TreatmentsFilters'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import TaskCard from '@/components/tasks/TaskCard'
import TaskStatusReasonModal from '@/components/tasks/TaskStatusReasonModal'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import { toEditableTask } from '@/lib/tasks/taskHelpers'
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
  const headerT = useTranslations('conciergeHeader')
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

  if (loading) {
    return (
      <main className="h-screen min-h-0 overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md items-center justify-center bg-[#F6F8FC]">
          <p className="text-[#6E7F9D]">{t('loading')}</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen min-h-0 overflow-hidden bg-[#F6F8FC]">
        <div className="relative mx-auto flex h-screen min-h-0 w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <PageHeader
            compact={compactHeader}
            title={t('title')}
            showUserButton
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 20 : 24} />,
                    label: headerT('openMessages'),
                    count: headerConversation.unreadCount,
                    onClick: () => {
                      void headerConversation.openInbox()
                    },
                  }
                : null
            }
            rightSlot={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void ownerRequests.openModal()
                  }}
                  className={`relative shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm ${
                    ownerRequests.openCount > 0
                      ? 'border-[#F6D48B] bg-[#FFF7E3] text-[#B7791F] hover:bg-[#FFF3D6]'
                      : 'border-[#D9E0EA] bg-white/88 text-[#6E7F9D] hover:bg-white'
                  } ${
                    compactHeader
                      ? 'flex h-11 w-11 items-center justify-center rounded-[22px]'
                      : 'flex h-14 w-14 items-center justify-center rounded-[22px]'
                  }`}
                  aria-label={headerT('openManagerEvents')}
                >
                  <BellDot size={compactHeader ? 20 : 22} />
                  {ownerRequests.openCount > 0 ? (
                    <span className={`absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none text-white ${
                      ownerRequests.unreadCount > 0 ? 'bg-[#D64555]' : 'bg-[#D4A017]'
                    }`}>
                      {ownerRequests.openCount > 9 ? '9+' : ownerRequests.openCount}
                    </span>
                  ) : null}
                </button>

                {compactHeader ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTask(null)
                      setModalOpen(true)
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
                    aria-label={t('newTreatment')}
                  >
                    <Plus size={22} />
                  </button>
                ) : null}
              </div>
            }
          >
            <div
              className={`relative z-40 transition-all duration-300 ${
                compactHeader
                  ? 'pointer-events-none max-h-0 -translate-y-2 overflow-hidden opacity-0'
                  : 'max-h-[220px] translate-y-0 overflow-visible opacity-100'
              }`}
            >
              <ManagerBuildingChip
                buildingId={buildingId}
                buildingName={buildingName || t('noBuilding')}
                buildings={buildings}
                getBuildingHref={(nextBuildingId) =>
                  `/treatments?buildingId=${nextBuildingId}`
                }
                label={t('building')}
                mainHref="/dashboard"
                mainLabel={headerT('allBuildings')}
                mainDescription={headerT('backToOverview')}
                size="compact"
                singleBuildingMode="static"
              />

              {activeTab === 'scheduled' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null)
                    setModalOpen(true)
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-[28px] bg-[#3E63E6] px-5 py-3.5 text-[17px] font-semibold text-white shadow-[0_16px_30px_rgba(62,99,230,0.28)] hover:bg-[#3558D8]"
                >
                  <Plus size={26} />
                  {t('newTreatment')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => exportHistoryToExcel(filteredTreatments)}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-[28px] border border-[#DCE7F5] bg-white px-5 py-3.5 text-[17px] font-semibold text-[#2F66C8] shadow-[0_12px_24px_rgba(20,41,82,0.08)] hover:bg-[#F8FBFF]"
                >
                  <Download size={22} />
                  {t('exportExcel')}
                </button>
              )}
            </div>
          </PageHeader>

          <section
            ref={setScrollContainer}
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-3"
          >
            <div className="space-y-3">
              {resultMessage && (
                <div className="rounded-[20px] border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-3 text-sm font-medium text-[#2F66C8] shadow-[0_8px_24px_rgba(47,102,200,0.08)]">
                  {resultMessage}
                </div>
              )}

              <TreatmentsFilters
                activeTab={activeTab}
                setActiveTab={handleChangeTab}
                search={search}
                setSearch={setSearch}
                pestFilter={pestFilter}
                setPestFilter={setPestFilter}
                visitFilter={visitFilter}
                setVisitFilter={setVisitFilter}
              />

              {activeTab === 'scheduled' ? (
                scheduledTasks.length === 0 ? (
                  <EmptyState text={t('emptyScheduled')} />
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
                        onComplete={() => updateTaskStatus(task.id, 'completed')}
                        onSetInProgress={() =>
                          updateTaskStatus(task.id, 'in_progress')
                        }
                        onSetPending={() => handleSetPendingTask(task)}
                        onDelete={() => deleteScheduledTask(task.id)}
                        onEdit={() => {
                          setSelectedTask(toEditableTask(task))
                          setModalOpen(true)
                        }}
                      />
                    ))}
                  </div>
                )
              ) : groupedTreatments.length === 0 ? (
                <EmptyState text={t('emptyHistory')} />
              ) : (
                <PestHistorySection
                  groupedTreatments={groupedTreatments}
                  expandedApartment={expandedApartment}
                  expandedPestKey={expandedPestKey}
                  setExpandedApartment={setExpandedApartment}
                  setExpandedPestKey={setExpandedPestKey}
                  onDeleteHistoryRecord={deleteHistoryRecord}
                />
              )}
            </div>
          </section>

          <BottomNav active="treatments" buildingId={buildingId} />
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title={headerT('messagesTitle')}
        subtitle={headerConversation.contactName || headerT('noAssignedContact')}
        currentUserId={headerConversation.currentUserId}
        messages={headerConversation.messages}
        value={headerConversation.value}
        sending={headerConversation.sending}
        loading={headerConversation.loadingConversation}
        error={headerConversation.error}
        onChange={headerConversation.setValue}
        onClose={headerConversation.closeConversation}
        onSubmit={() => {
          void headerConversation.sendMessage()
        }}
        canSaveAsTask
        onSaveAsTask={(message) => {
          setSelectedTask(null)
          setRequestTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setRequestSourceId(null)
          headerConversation.closeConversation()
          setModalOpen(true)
        }}
      />

      <GlobalMessagesInboxModal
        open={headerConversation.inboxOpen}
        conversations={headerConversation.inboxConversations}
        loading={headerConversation.loadingInbox}
        onClose={headerConversation.closeInbox}
        onSelect={(conversation) => {
          void headerConversation.openInboxConversation(conversation)
        }}
      />

      <OwnerRequestsModal
        open={ownerRequests.modalOpen}
        loading={ownerRequests.loading}
        error={ownerRequests.error}
        requests={ownerRequests.requests}
        onClose={ownerRequests.closeModal}
        onArchive={(requestId) => {
          void ownerRequests.archiveRequest(requestId)
        }}
        onConvert={(request) => {
          setRequestTaskDraft(ownerRequests.toTaskDraft(request))
          setRequestSourceId(request.id)
          ownerRequests.closeModal()
          setSelectedTask(null)
          setModalOpen(true)
        }}
      />

      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTask(null)
          setRequestTaskDraft(null)
          setRequestSourceId(null)
        }}
        onResultMessage={setResultMessage}
        buildingId={buildingId}
        profileId={profileId}
        onCreated={async () => {
          if (requestSourceId) {
            await ownerRequests.markConverted(requestSourceId)
          }
          await fetchTreatmentsData()
          await ownerRequests.reloadRequests()
        }}
        taskToEdit={selectedTask}
        initialValues={selectedTask ? null : requestTaskDraft}
        sourceRequestId={requestSourceId}
        defaultCategory="pest"
      />

      <TaskStatusReasonModal
        open={reopenReason.open}
        taskTitle={reopenReason.taskTitle}
        reason={reopenReason.reason}
        error={reopenReason.error}
        saving={reopenReason.saving}
        onChangeReason={reopenReason.setReason}
        onClose={reopenReason.close}
        onConfirm={() => {
          void reopenReason.confirm()
        }}
      />
    </>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-6 py-10 text-center text-[#7B8BA8]">{text}</div>
    </div>
  )
}
