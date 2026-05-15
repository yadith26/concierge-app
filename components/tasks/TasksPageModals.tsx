'use client'

import { useTranslations } from 'next-intl'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import TaskInventoryFlowModals from '@/components/tasks/TaskInventoryFlowModals'
import TaskStatusReasonModal from '@/components/tasks/TaskStatusReasonModal'
import type { TaskInventoryCompletionState } from '@/hooks/useTaskInventoryCompletion'
import type {
  BuildingMessage,
  RecentBuildingConversation,
} from '@/lib/messages/messageService'
import type { OwnerRequestItem } from '@/lib/owner-requests/ownerRequestHelpers'
import type { EditableTask, TaskDraft } from '@/lib/tasks/taskTypes'

type TasksPageModalsProps = {
  headerConversation: {
    modalOpen: boolean
    contactName: string
    currentUserId: string
    messages: BuildingMessage[]
    value: string
    sending: boolean
    loadingConversation: boolean
    error: string
    inboxOpen: boolean
    inboxConversations: RecentBuildingConversation[]
    loadingInbox: boolean
    setValue: (value: string) => void
    closeConversation: () => void
    sendMessage: () => Promise<void>
    closeInbox: () => void
    openInboxConversation: (
      conversation: RecentBuildingConversation
    ) => Promise<void>
  }
  ownerRequests: {
    modalOpen: boolean
    loading: boolean
    error: string
    requests: OwnerRequestItem[]
    closeModal: () => void
    archiveRequest: (requestId: string) => Promise<void>
    markConverted: (requestId: string) => Promise<boolean>
    reloadRequests: () => Promise<OwnerRequestItem[]>
  }
  taskInventory: TaskInventoryCompletionState
  reopenReason: {
    open: boolean
    taskTitle: string
    reason: string
    error: string | null
    saving: boolean
    setReason: (reason: string) => void
    close: () => void
    confirm: () => Promise<boolean>
  }
  modalOpen: boolean
  selectedTask: EditableTask | null
  requestTaskDraft: TaskDraft | null
  requestSourceId: string | null
  buildingId: string
  profileId: string
  onSaveMessageAsTask: (message: BuildingMessage) => void
  onConvertOwnerRequest: (request: OwnerRequestItem) => void
  onCloseTaskModal: () => void
  onCreated: () => Promise<void>
}

export default function TasksPageModals({
  headerConversation,
  ownerRequests,
  taskInventory,
  reopenReason,
  modalOpen,
  selectedTask,
  requestTaskDraft,
  requestSourceId,
  buildingId,
  profileId,
  onSaveMessageAsTask,
  onConvertOwnerRequest,
  onCloseTaskModal,
  onCreated,
}: TasksPageModalsProps) {
  const headerT = useTranslations('conciergeHeader')

  return (
    <>
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
        onSaveAsTask={onSaveMessageAsTask}
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
        onConvert={onConvertOwnerRequest}
      />

      <TaskFormModal
        open={modalOpen}
        onClose={onCloseTaskModal}
        buildingId={buildingId}
        profileId={profileId}
        onCreated={onCreated}
        taskToEdit={selectedTask}
        initialValues={selectedTask ? null : requestTaskDraft}
        sourceRequestId={requestSourceId}
      />

      <TaskInventoryFlowModals taskInventory={taskInventory} />

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
