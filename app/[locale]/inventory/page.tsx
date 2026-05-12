'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BellDot, Download, MessageSquareMore, Plus } from 'lucide-react'
import BottomNav from '@/components/layout/BottomNav'
import PageHeader from '@/components/layout/PageHeader'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import InventoryConfirmExistingItemModal from '@/components/inventory/InventoryConfirmExistingItemModal'
import InventoryFilters from '@/components/inventory/InventoryFilters'
import InventoryFormModal from '@/components/inventory/InventoryFormModal'
import InventoryHeaderActions from '@/components/inventory/InventoryHeaderActions'
import InventoryList from '@/components/inventory/InventoryList'
import InventoryManualAdjustModal from '@/components/inventory/InventoryManualAdjustModal'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import OwnerRequestsModal from '@/components/owner-requests/OwnerRequestsModal'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import useInventoryPage from '@/hooks/useInventoryPage'
import useInventoryViewModel from '@/hooks/useInventoryViewModel'
import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import { useSyncConciergeBuildingUrl } from '@/hooks/useSyncConciergeBuildingUrl'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

export default function InventoryPage() {
  const t = useTranslations()
  const pageT = useTranslations('inventoryPage')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const selectedBuildingId = searchParams.get('buildingId')
  const inventory = useInventoryPage(selectedBuildingId)
  const headerConversation = useHeaderConversation({
    preferredBuildingId: selectedBuildingId || undefined,
  })
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)
  const ownerRequests = useOwnerRequestsInbox(inventory.buildingId)
  const {
    items,
    history,
    buildingName,
    buildings,
    buildingId,
    profileId,
    loading,
    compactHeader,
    scrollRef,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    conditionFilter,
    setConditionFilter,
    locationFilter,
    setLocationFilter,
    availableLocations,
    onlyLowStock,
    setOnlyLowStock,
    viewMode,
    setViewMode,
    hasActiveFilters,
    clearFilters,
    expandedCategory,
    setExpandedCategory,
    expandedItemId,
    setExpandedItemId,
    photos,
    existingPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
    openCreateModal,
    openEditModal,
    quickAdjustStock,
    formOpen,
    saving,
    message,
    setMessage,
    confirmExistingOpen,
    confirmExistingItem,
    confirmExistingPayload,
    manualAdjustOpen,
    manualAdjustSaving,
    manualAdjustItem,
    manualAdjustReason,
    setManualAdjustReason,
    manualAdjustQuantity,
    setManualAdjustQuantity,
    editingItem,
    initialCategory,
    initialLocation,
    initialItemType,
    initialUnitOfMeasure,
    availableCategories,
    availableNames,
    handleAddCategory,
    handleAddLocation,
    useExistingInventoryItem,
    closeConfirmExistingModal,
    confirmUseExistingInventoryItem,
    closeFormModal,
    saveInventoryItem,
    closeManualAdjustModal,
    confirmManualAdjust,
  } = inventory

  const formInitialValues = useMemo(() => {
    if (editingItem) return null

    return {
      item_type: initialItemType,
      unit_of_measure: initialUnitOfMeasure,
    }
  }, [editingItem, initialItemType, initialUnitOfMeasure])

  useSyncConciergeBuildingUrl({
    buildingId,
    path: '/inventory',
    selectedBuildingId,
  })

  const {
    filteredItems,
    groupedCategories,
    totalLowStock,
    handleExportInventory,
  } = useInventoryViewModel({
    items,
    history,
    buildingName,
    locale,
    t,
    search,
    categoryFilter,
    conditionFilter,
    locationFilter,
    availableCategories,
    availableLocations,
    onlyLowStock,
    viewMode,
  })

  if (loading) {
    return (
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md items-center justify-center bg-[#F6F8FC]">
          <p className="text-[#6E7F9D]">{pageT('loading')}</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <PageHeader
            compact={compactHeader}
            title={pageT('title')}
            showUserButton
            expandedHeightClass="min-h-[248px]"
            compactHeightClass="h-[92px]"
            expandedTitleClass="pt-2 text-[38px] leading-none"
            compactTitleClass="pt-1 text-[24px] leading-none"
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 20 : 24} />,
                    label: 'Abrir mensajes',
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
                  aria-label="Abrir eventos del manager"
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
                    onClick={() => openCreateModal()}
                    className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
                    aria-label={pageT('newItem')}
                  >
                    <Plus size={22} />
                  </button>
                ) : null}
              </div>
            }
          >
            <div className="space-y-4">
              {buildings.length > 1 ? (
                <ManagerBuildingChip
                  buildingId={buildingId}
                  buildingName={buildingName || 'Sin edificio'}
                  buildings={buildings}
                  getBuildingHref={(nextBuildingId) =>
                    `/inventory?buildingId=${nextBuildingId}`
                  }
                  label="Edificio actual"
                  mainHref="/dashboard"
                  mainLabel="Mis edificios"
                  mainDescription="Volver a la vista general"
                  size="compact"
                  singleBuildingMode="static"
                />
              ) : null}

              <InventoryHeaderActions
                buildingName={buildingName}
                onOpenCreate={() => openCreateModal()}
                showBuilding={buildings.length <= 1}
              />
            </div>
          </PageHeader>

          <section
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-40 pt-3"
          >
            <div className="space-y-4">
              <div>
                <button
                  onClick={handleExportInventory}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#DCE7F5] bg-white px-4 py-3 text-sm font-semibold text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.06)] hover:bg-[#F8FAFE]"
                  type="button"
                >
                  <Download size={18} />
                  {pageT('export')}
                </button>
              </div>

           <InventoryFilters
  search={search}
  onSearchChange={setSearch}

  categoryFilter={categoryFilter}
  onCategoryFilterChange={setCategoryFilter}
  availableCategories={availableCategories}

  conditionFilter={conditionFilter}
  onConditionFilterChange={setConditionFilter}

  locationFilter={locationFilter}
  onLocationFilterChange={setLocationFilter}
  availableLocations={availableLocations}

  onlyLowStock={onlyLowStock}
  onToggleOnlyLowStock={() => setOnlyLowStock((prev) => !prev)}
  totalLowStock={totalLowStock}

  viewMode={viewMode}
  onViewModeChange={setViewMode}

  hasActiveFilters={hasActiveFilters}
  onClearFilters={clearFilters}
/>

              <InventoryList
                viewMode={viewMode}
                groupedCategories={groupedCategories}
                filteredItems={filteredItems}
                expandedCategory={expandedCategory}
                expandedItemId={expandedItemId}
                onSetExpandedCategory={setExpandedCategory}
                onSetExpandedItemId={setExpandedItemId}
                onOpenCreateModal={openCreateModal}
                onOpenEditModal={openEditModal}
                onQuickAdjustStock={quickAdjustStock}
                history={history}
              />
            </div>
          </section>

          <BottomNav active="inventory" buildingId={buildingId} />
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title="Mensajes"
        subtitle={headerConversation.contactName || 'Sin contacto asignado'}
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
          setRequestTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setRequestSourceId(null)
          headerConversation.closeConversation()
          setTaskModalOpen(true)
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
          setTaskModalOpen(true)
        }}
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
        onAddCategory={handleAddCategory}
        onAddLocation={handleAddLocation}
        onUseExistingItem={useExistingInventoryItem}
        onMessage={setMessage}
        onSelectPhotos={handlePhotosSelected}
        onRemoveExistingPhoto={removeExistingPhoto}
        onRemoveNewPhoto={removeNewPhoto}
        onClose={closeFormModal}
        onSave={saveInventoryItem}
      />

      <InventoryManualAdjustModal
        open={manualAdjustOpen}
        item={manualAdjustItem}
        quantity={manualAdjustQuantity}
        reason={manualAdjustReason}
        saving={manualAdjustSaving}
        errorMessage={manualAdjustOpen ? message : ''}
        onQuantityChange={setManualAdjustQuantity}
        onReasonChange={setManualAdjustReason}
        onClose={closeManualAdjustModal}
        onConfirm={() => {
          void confirmManualAdjust()
        }}
      />

      <InventoryConfirmExistingItemModal
        open={confirmExistingOpen}
        item={confirmExistingItem}
        quantity={confirmExistingPayload?.quantity ?? 0}
        unitOfMeasure={confirmExistingPayload?.unit_of_measure}
        context="manual"
        saving={saving}
        message={confirmExistingOpen ? message : ''}
        onClose={closeConfirmExistingModal}
        onConfirm={() => {
          void confirmUseExistingInventoryItem()
        }}
      />

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setRequestTaskDraft(null)
          setRequestSourceId(null)
        }}
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
