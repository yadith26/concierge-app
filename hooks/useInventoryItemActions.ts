'use client'

import { supabase } from '@/lib/supabase'
import { normalizeInventoryCategory } from '@/lib/inventory/inventoryCatalog'
import {
  createInventoryItem,
  type SaveInventoryPayload,
} from '@/lib/inventory/inventoryMutations'
import { insertInventoryHistoryEntry } from '@/lib/inventory/inventoryHistoryMutations'
import {
  deleteRemovedInventoryPhotos,
  uploadPhotosForInventoryItem,
} from '@/lib/inventory/inventoryPhotoActions'
import type {
  EditableInventoryItem,
  ExistingInventoryPhoto,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import type { SelectedInventoryPhoto } from '@/hooks/useInventoryPhotos'

type UseInventoryItemActionsParams = {
  buildingId: string
  profileId: string
  items: InventoryItem[]
  editingItem: EditableInventoryItem | null
  existingPhotos: ExistingInventoryPhoto[]
  removedPhotoIds: string[]
  photos: SelectedInventoryPhoto[]
  hydrateExistingPhotos: (photos: ExistingInventoryPhoto[]) => void
  resetAllPhotos: () => void
  fetchInventoryData: () => Promise<void>
  setEditingItem: (value: EditableInventoryItem | null) => void
  setInitialCategory: (value: string) => void
  setInitialLocation: (value: string) => void
  setInitialItemType: (value: string) => void
  setInitialUnitOfMeasure: (value: string) => void
  setMessage: (value: string) => void
  setFormOpen: (value: boolean) => void
  setSaving: (value: boolean) => void
  setExpandedCategory: (value: string | null) => void
  setAvailableCategories: (updater: (prev: string[]) => string[]) => void
  setAvailableLocations: (updater: (prev: string[]) => string[]) => void
  setAvailableNames: (updater: (prev: string[]) => string[]) => void
}

export default function useInventoryItemActions({
  buildingId,
  profileId,
  items,
  editingItem,
  existingPhotos,
  removedPhotoIds,
  photos,
  hydrateExistingPhotos,
  resetAllPhotos,
  fetchInventoryData,
  setEditingItem,
  setInitialCategory,
  setInitialLocation,
  setInitialItemType,
  setInitialUnitOfMeasure,
  setMessage,
  setFormOpen,
  setSaving,
  setExpandedCategory,
  setAvailableCategories,
  setAvailableLocations,
  setAvailableNames,
}: UseInventoryItemActionsParams) {
  const openCreateModal = (
    category = '',
    location = '',
    initialValues?: { item_type?: string; unit_of_measure?: string }
  ) => {
    setEditingItem(null)
    setInitialCategory(category)
    setInitialLocation(location)
    setInitialItemType(initialValues?.item_type || '')
    setInitialUnitOfMeasure(initialValues?.unit_of_measure || 'unidad')
    setMessage('')
    resetAllPhotos()
    setFormOpen(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      category: item.category || '',
      item_type: item.item_type || '',
      unit_of_measure: item.unit_of_measure || 'unidad',
      quantity: String(item.quantity ?? 0),
      minimum_stock: String(item.minimum_stock ?? 0),
      location: item.location || '',
      condition: item.condition,
      notes: item.notes || '',
      inventory_item_photos: item.inventory_item_photos || [],
    })
    setInitialCategory(item.category || '')
    setInitialLocation(item.location || '')
    setInitialUnitOfMeasure(item.unit_of_measure || 'unidad')
    setMessage('')
    hydrateExistingPhotos(item.inventory_item_photos || [])
    setFormOpen(true)
  }

  const closeFormModal = () => {
    setFormOpen(false)
    setEditingItem(null)
    setInitialCategory('')
    setInitialLocation('')
    setInitialItemType('')
    setInitialUnitOfMeasure('unidad')
    setMessage('')
    resetAllPhotos()
  }

  const handleAddCategory = (newCategory: string) => {
    const value = newCategory.trim()
    if (!value) return

    setAvailableCategories((prev) => {
      const exists = prev.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
      return exists ? prev : [...prev, value]
    })

    setInitialCategory(value)
  }

  const handleAddLocation = (newLocation: string) => {
    const value = newLocation.trim()
    if (!value) return

    setAvailableLocations((prev) => {
      const exists = prev.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
      return exists ? prev : [...prev, value]
    })

    setInitialLocation(value)
  }

  const handleAddName = (newName: string) => {
    const value = newName.trim()
    if (!value) return

    setAvailableNames((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === value.toLowerCase())
      return exists ? prev : [...prev, value].sort((a, b) => a.localeCompare(b))
    })
  }

  const saveInventoryItem = async (payload: SaveInventoryPayload) => {
    if (!buildingId || !profileId) {
      setMessage('inventory.errors.missingUser')
      return
    }

    if (!payload.name.trim()) {
      setMessage('inventory.errors.nameRequired')
      return
    }

    if (!payload.category.trim()) {
      setMessage('inventory.errors.categoryRequired')
      return
    }

    if (!payload.condition) {
      setMessage('Selecciona un estado.')
      return
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
      setMessage('inventory.errors.invalidQuantity')
      return
    }

    if (!Number.isFinite(payload.minimum_stock) || payload.minimum_stock < 0) {
      setMessage('inventory.errors.invalidStock')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      if (editingItem) {
        const currentItem = items.find((item) => item.id === editingItem.id)

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            name: payload.name.trim(),
            category: normalizeInventoryCategory(payload.category),
            item_type: payload.item_type?.trim() || null,
            unit_of_measure: payload.unit_of_measure?.trim() || 'unidad',
            quantity: payload.quantity,
            minimum_stock: payload.minimum_stock,
            location: payload.location.trim() || null,
            condition: payload.condition,
            notes: payload.notes.trim() || null,
          })
          .eq('id', editingItem.id)

        if (updateError) {
          const errorText = [
            updateError.message,
            updateError.details,
            updateError.hint,
            updateError.code,
          ]
            .filter(Boolean)
            .join(' | ')
            .toLowerCase()

          if (
            errorText.includes('unit_of_measure') &&
            (errorText.includes('column') || errorText.includes('schema cache'))
          ) {
            setMessage(
              'Corre inventory_measurement_units.sql para guardar unidades de medida en inventario.'
            )
            return
          }

          console.error('Error updating item:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code,
          })
          setMessage('inventory.errors.updateFailed')
          return
        }

        await insertInventoryHistoryEntry({
          itemId: editingItem.id,
          actionType: 'edited',
          movementType: 'updated',
          sourceType: 'manual',
          quantityBefore: currentItem?.quantity ?? payload.quantity,
          quantityChange:
            payload.quantity - (currentItem?.quantity ?? payload.quantity),
          quantityAfter: payload.quantity,
          note: 'inventory.history.updated',
          createdBy: profileId,
        })

        await deleteRemovedInventoryPhotos({
          removedPhotoIds,
          itemPhotos: editingItem.inventory_item_photos || existingPhotos,
        })

        await uploadPhotosForInventoryItem({
          itemId: editingItem.id,
          profileId,
          photos,
        })
      } else {
        try {
          const insertedItem = await createInventoryItem({
            buildingId,
            profileId,
            payload,
          })

          await uploadPhotosForInventoryItem({
            itemId: insertedItem.id,
            profileId,
            photos,
          })
        } catch (error) {
          console.error('Error creating item:', error)
          setMessage('inventory.errors.createFailed')
          return
        }

        setExpandedCategory(payload.category.trim())
      }

      closeFormModal()
      await fetchInventoryData()
    } catch (error) {
      console.error('Error saving inventory:', error)
      setMessage('inventory.errors.saveError')
    } finally {
      setSaving(false)
    }
  }

  const quickAdjustStock = async (
    item: InventoryItem,
    change: number,
    options?: {
      note?: string | null
      unitLabel?: string | null
    }
  ) => {
    if (!profileId) return

    const nextQuantity = item.quantity + change
    if (nextQuantity < 0) return false

    try {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: nextQuantity })
        .eq('id', item.id)

      if (updateError) {
        console.error('Error adjusting stock:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        })
        return false
      }

      await insertInventoryHistoryEntry({
        itemId: item.id,
        actionType: 'stock_adjustment',
        movementType: 'manual_adjustment',
        sourceType: 'manual',
        unitLabel: options?.unitLabel?.trim() || null,
        quantityBefore: item.quantity,
        quantityChange: change,
        quantityAfter: nextQuantity,
        note:
          options?.note?.trim() ||
          (change > 0
            ? 'inventory.history.quickAdd'
            : 'inventory.history.quickRemove'),
        createdBy: profileId,
      })

      await fetchInventoryData()
      return true
    } catch (error) {
      console.error('Error in quick adjustment:', error)
      return false
    }
  }

  return {
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleAddCategory,
    handleAddLocation,
    handleAddName,
    saveInventoryItem,
    quickAdjustStock,
  }
}
