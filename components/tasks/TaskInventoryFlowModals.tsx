'use client'

import InventoryConfirmExistingItemModal from '@/components/inventory/InventoryConfirmExistingItemModal'
import InventoryFormModal from '@/components/inventory/InventoryFormModal'
import TaskInventoryPromptModal from '@/components/tasks/TaskInventoryPromptModal'
import TaskInventorySelectModal from '@/components/tasks/TaskInventorySelectModal'
import TaskInventoryUsageModal from '@/components/tasks/TaskInventoryUsageModal'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import type { TaskInventoryCompletionState } from '@/hooks/useTaskInventoryCompletion'

type TaskInventoryFlowModalsProps = {
  taskInventory: TaskInventoryCompletionState
}

export default function TaskInventoryFlowModals({
  taskInventory,
}: TaskInventoryFlowModalsProps) {
  return (
    <>
      <TaskInventoryPromptModal
        open={taskInventory.promptOpen}
        taskTitle={taskInventory.pendingTask?.title || ''}
        taskCategory={taskInventory.pendingTask?.category}
        message={taskInventory.inventoryMessage}
        onClose={taskInventory.closePrompt}
        onSkip={() => {
          void taskInventory.completeWithoutInventory()
        }}
        onUseExistingItem={() => {
          void taskInventory.openExistingInventorySelector()
        }}
        onAddToInventory={() => {
          void taskInventory.openInventoryForm()
        }}
      />

      <TaskInventorySelectModal
        open={taskInventory.inventorySelectionOpen}
        taskTitle={taskInventory.pendingTask?.title || ''}
        taskCategory={taskInventory.pendingTask?.category}
        itemLabel={taskInventory.inferredInventoryItemLabel || 'item'}
        items={taskInventory.compatibleInventoryItems}
        reasonMap={taskInventory.compatibleInventoryReasonMap}
        suggestedItemId={taskInventory.suggestedInventoryItemId}
        infoMessage={taskInventory.inventorySelectionInfo}
        message={taskInventory.inventoryMessage}
        saving={taskInventory.savingInventory}
        onClose={taskInventory.closeInventorySelection}
        onCreateNew={() => {
          void taskInventory.continueCreatingNewInventoryItem()
        }}
        onSelectItem={(item: InventoryItem) => {
          void taskInventory.selectExistingInventoryItem(item)
        }}
      />

      <TaskInventoryUsageModal
        open={taskInventory.inventoryUsageOpen}
        item={taskInventory.selectedInventoryItem}
        taskTitle={taskInventory.pendingTask?.title || ''}
        quantity={taskInventory.inventoryUsageQuantity}
        location={taskInventory.inventoryUsageLocation}
        isMaterial={taskInventory.isSelectedInventoryMaterial}
        saving={taskInventory.savingInventory}
        message={taskInventory.inventoryMessage}
        onClose={taskInventory.closeInventoryUsage}
        onChangeQuantity={taskInventory.setInventoryUsageQuantity}
        onChangeLocation={taskInventory.setInventoryUsageLocation}
        onConfirm={() => {
          void taskInventory.confirmInventoryUsage()
        }}
      />

      <InventoryConfirmExistingItemModal
        open={taskInventory.confirmExistingOpen}
        item={taskInventory.selectedInventoryItem}
        quantity={1}
        context="delivery"
        saving={taskInventory.savingInventory}
        message={
          taskInventory.confirmExistingOpen ? taskInventory.inventoryMessage : ''
        }
        onClose={taskInventory.closeConfirmExistingInventoryItem}
        onConfirm={() => {
          void taskInventory.confirmExistingInventoryIncrease()
        }}
      />

      <InventoryFormModal
        open={taskInventory.inventoryModalOpen}
        saving={taskInventory.savingInventory}
        message={taskInventory.inventoryMessage}
        itemToEdit={null}
        initialCategory=""
        initialLocation=""
        initialValues={taskInventory.initialValues}
        existingPhotos={taskInventory.existingPhotos}
        photos={taskInventory.photos}
        availableNames={taskInventory.availableNames}
        availableCategories={taskInventory.availableCategories}
        availableLocations={taskInventory.availableLocations}
        onAddCategory={taskInventory.addCategoryOption}
        onAddLocation={taskInventory.addLocationOption}
        onMessage={taskInventory.setInventoryMessage}
        onSelectPhotos={taskInventory.handlePhotosSelected}
        onRemoveExistingPhoto={taskInventory.removeExistingPhoto}
        onRemoveNewPhoto={taskInventory.removeNewPhoto}
        onClose={taskInventory.closeInventoryModal}
        onSave={taskInventory.saveInventoryAndComplete}
      />
    </>
  )
}
