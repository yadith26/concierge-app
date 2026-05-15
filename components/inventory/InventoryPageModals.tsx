'use client'

import { useTranslations } from 'next-intl'
import InventoryConfirmExistingItemModal from '@/components/inventory/InventoryConfirmExistingItemModal'
import InventoryFormModal from '@/components/inventory/InventoryFormModal'
import InventoryManualAdjustModal from '@/components/inventory/InventoryManualAdjustModal'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import type { SelectedInventoryPhoto } from '@/hooks/useInventoryPhotos'
import type { BuildingMessage, RecentBuildingConversation } from '@/lib/messages/messageService'
import type { OwnerRequestItem } from '@/lib/owner-requests/ownerRequestHelpers'
import type { SaveInventoryPayload } from '@/lib/inventory/inventoryMutations'
import type {
  EditableInventoryItem,
  ExistingInventoryPhoto,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

type InventoryPageModalsProps = {
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
    toTaskDraft: (request: OwnerRequestItem) => TaskDraft
    markConverted: (requestId: string) => Promise<boolean>
    reloadRequests: () => Promise<OwnerRequestItem[]>
  }
  taskModalOpen: boolean
  requestTaskDraft: TaskDraft | null
  requestSourceId: string | null
  buildingId: string
  profileId: string
  onSaveMessageAsTask: (message: BuildingMessage) => void
  onConvertOwnerRequest: (request: OwnerRequestItem) => void
  onCloseTaskModal: () => void
  formOpen: boolean
  saving: boolean
  message: string
  editingItem: EditableInventoryItem | null
  initialCategory: string
  initialLocation: string
  formInitialValues: {
    item_type?: string
    unit_of_measure?: string
  } | null
  existingPhotos: ExistingInventoryPhoto[]
  photos: SelectedInventoryPhoto[]
  items: InventoryItem[]
  availableNames: string[]
  availableCategories: string[]
  availableLocations: string[]
  onAddCategory: (value: string) => void
  onAddLocation: (value: string) => void
  onUseExistingItem: (
    item: InventoryItem,
    payload: SaveInventoryPayload
  ) => Promise<void>
  onMessage: (message: string) => void
  onSelectPhotos: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => { ok: boolean; message?: string }
  onRemoveExistingPhoto: (photo: ExistingInventoryPhoto) => void
  onRemoveNewPhoto: (index: number) => void
  onCloseFormModal: () => void
  onSaveInventoryItem: (payload: SaveInventoryPayload) => Promise<void>
  manualAdjustOpen: boolean
  manualAdjustItem: InventoryItem | null
  manualAdjustQuantity: string
  manualAdjustReason: string
  manualAdjustSaving: boolean
  onManualAdjustQuantityChange: (value: string) => void
  onManualAdjustReasonChange: (value: string) => void
  onCloseManualAdjustModal: () => void
  onConfirmManualAdjust: () => Promise<void>
  confirmExistingOpen: boolean
  confirmExistingItem: InventoryItem | null
  confirmExistingQuantity: number
  confirmExistingUnitOfMeasure?: string | null
  onCloseConfirmExistingModal: () => void
  onConfirmUseExistingInventoryItem: () => Promise<void>
}

export default function InventoryPageModals({
  headerConversation,
  ownerRequests,
  taskModalOpen,
  requestTaskDraft,
  requestSourceId,
  buildingId,
  profileId,
  onSaveMessageAsTask,
  onConvertOwnerRequest,
  onCloseTaskModal,
  formOpen,
  saving,
  message,
  editingItem,
  initialCategory,
  initialLocation,
  formInitialValues,
  existingPhotos,
  photos,
  items,
  availableNames,
  availableCategories,
  availableLocations,
  onAddCategory,
  onAddLocation,
  onUseExistingItem,
  onMessage,
  onSelectPhotos,
  onRemoveExistingPhoto,
  onRemoveNewPhoto,
  onCloseFormModal,
  onSaveInventoryItem,
  manualAdjustOpen,
  manualAdjustItem,
  manualAdjustQuantity,
  manualAdjustReason,
  manualAdjustSaving,
  onManualAdjustQuantityChange,
  onManualAdjustReasonChange,
  onCloseManualAdjustModal,
  onConfirmManualAdjust,
  confirmExistingOpen,
  confirmExistingItem,
  confirmExistingQuantity,
  confirmExistingUnitOfMeasure,
  onCloseConfirmExistingModal,
  onConfirmUseExistingInventoryItem,
}: InventoryPageModalsProps) {
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

      <InventoryFormModal
        open={formOpen}
        saving={saving}
        message={message}
        itemToEdit={editingItem}
        initialCategory={initialCategory}
        initialLocation={initialLocation}
        initialValues={formInitialValues}
        existingPhotos={existingPhotos}
        photos={photos}
        items={items}
        availableNames={availableNames}
        availableCategories={availableCategories}
        availableLocations={availableLocations}
        onAddCategory={onAddCategory}
        onAddLocation={onAddLocation}
        onUseExistingItem={onUseExistingItem}
        onMessage={onMessage}
        onSelectPhotos={onSelectPhotos}
        onRemoveExistingPhoto={onRemoveExistingPhoto}
        onRemoveNewPhoto={onRemoveNewPhoto}
        onClose={onCloseFormModal}
        onSave={onSaveInventoryItem}
      />

      <InventoryManualAdjustModal
        open={manualAdjustOpen}
        item={manualAdjustItem}
        quantity={manualAdjustQuantity}
        reason={manualAdjustReason}
        saving={manualAdjustSaving}
        errorMessage={manualAdjustOpen ? message : ''}
        onQuantityChange={onManualAdjustQuantityChange}
        onReasonChange={onManualAdjustReasonChange}
        onClose={onCloseManualAdjustModal}
        onConfirm={() => {
          void onConfirmManualAdjust()
        }}
      />

      <InventoryConfirmExistingItemModal
        open={confirmExistingOpen}
        item={confirmExistingItem}
        quantity={confirmExistingQuantity}
        unitOfMeasure={confirmExistingUnitOfMeasure}
        context="manual"
        saving={saving}
        message={confirmExistingOpen ? message : ''}
        onClose={onCloseConfirmExistingModal}
        onConfirm={() => {
          void onConfirmUseExistingInventoryItem()
        }}
      />

      <TaskFormModal
        open={taskModalOpen}
        onClose={onCloseTaskModal}
        buildingId={buildingId}
        profileId={profileId}
        onCreated={async () => {
          if (requestSourceId) {
            await ownerRequests.markConverted(requestSourceId)
          }
          await ownerRequests.reloadRequests()
        }}
        initialValues={requestTaskDraft}
        sourceRequestId={requestSourceId}
      />
    </>
  )
}
