'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import BottomNav from '@/components/layout/BottomNav'
import ConciergePageShell from '@/components/layout/ConciergePageShell'
import InventoryPageContent from '@/components/inventory/InventoryPageContent'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import InventoryPageModals from '@/components/inventory/InventoryPageModals'
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

  return (
    <>
      <ConciergePageShell
        loading={loading}
        loadingLabel={pageT('loading')}
        bottomNav={<BottomNav active="inventory" buildingId={buildingId} />}
      >
        <InventoryPageHeader
          compact={compactHeader}
          buildingId={buildingId}
          buildingName={buildingName}
          buildings={buildings}
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
          onOpenCreate={() => openCreateModal()}
        />

        <InventoryPageContent
          scrollRef={scrollRef}
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
          onExport={handleExportInventory}
        />
      </ConciergePageShell>

      <InventoryPageModals
        headerConversation={headerConversation}
        ownerRequests={ownerRequests}
        taskModalOpen={taskModalOpen}
        requestTaskDraft={requestTaskDraft}
        requestSourceId={requestSourceId}
        buildingId={buildingId}
        profileId={profileId}
        onSaveMessageAsTask={(message) => {
          setRequestTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setRequestSourceId(null)
          headerConversation.closeConversation()
          setTaskModalOpen(true)
        }}
        onConvertOwnerRequest={(request) => {
          setRequestTaskDraft(ownerRequests.toTaskDraft(request))
          setRequestSourceId(request.id)
          ownerRequests.closeModal()
          setTaskModalOpen(true)
        }}
        onCloseTaskModal={() => {
          setTaskModalOpen(false)
          setRequestTaskDraft(null)
          setRequestSourceId(null)
        }}
        formOpen={formOpen}
        saving={saving}
        message={message}
        editingItem={editingItem}
        initialCategory={initialCategory}
        initialLocation={initialLocation}
        formInitialValues={formInitialValues}
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
        onCloseFormModal={closeFormModal}
        onSaveInventoryItem={saveInventoryItem}
        manualAdjustOpen={manualAdjustOpen}
        manualAdjustItem={manualAdjustItem}
        manualAdjustQuantity={manualAdjustQuantity}
        manualAdjustReason={manualAdjustReason}
        manualAdjustSaving={manualAdjustSaving}
        onManualAdjustQuantityChange={setManualAdjustQuantity}
        onManualAdjustReasonChange={setManualAdjustReason}
        onCloseManualAdjustModal={closeManualAdjustModal}
        onConfirmManualAdjust={confirmManualAdjust}
        confirmExistingOpen={confirmExistingOpen}
        confirmExistingItem={confirmExistingItem}
        confirmExistingQuantity={confirmExistingPayload?.quantity ?? 0}
        confirmExistingUnitOfMeasure={confirmExistingPayload?.unit_of_measure}
        onCloseConfirmExistingModal={closeConfirmExistingModal}
        onConfirmUseExistingInventoryItem={confirmUseExistingInventoryItem}
      />
    </>
  )
}
