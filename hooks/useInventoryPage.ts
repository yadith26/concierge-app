'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import useInventoryFiltersState from '@/hooks/useInventoryFiltersState'
import useInventoryItemActions from '@/hooks/useInventoryItemActions'
import { useInventoryPhotos } from '@/hooks/useInventoryPhotos'
import { loadInventoryPageData } from '@/lib/inventory/inventoryDataService'
import { isMaterialInventoryCategory } from '@/lib/inventory/inventoryCatalog'
import {
  DEFAULT_INVENTORY_CATEGORIES,
  DEFAULT_INVENTORY_LOCATIONS,
  type SaveInventoryPayload,
} from '@/lib/inventory/inventoryMutations'
import type {
  EditableInventoryItem,
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'

export default function useInventoryPage(selectedBuildingId?: string | null) {
  const manualAdjustT = useTranslations('inventoryManualAdjust')
  const t = useTranslations('inventoryPageMessages')
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const {
    photos,
    existingPhotos,
    removedPhotoIds,
    hydrateExistingPhotos,
    resetAllPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
  } = useInventoryPhotos()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [history, setHistory] = useState<InventoryHistory[]>([])
  const [buildingName, setBuildingName] = useState('')
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [buildingId, setBuildingId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [loading, setLoading] = useState(true)

  const {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    conditionFilter,
    setConditionFilter,
    locationFilter,
    setLocationFilter,
    onlyLowStock,
    setOnlyLowStock,
    viewMode,
    setViewMode,
    clearFilters,
    hasActiveFilters,
  } = useInventoryFiltersState()

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [manualAdjustOpen, setManualAdjustOpen] = useState(false)
  const [manualAdjustSaving, setManualAdjustSaving] = useState(false)
  const [manualAdjustItem, setManualAdjustItem] = useState<InventoryItem | null>(
    null
  )
  const [manualAdjustReason, setManualAdjustReason] = useState('')
  const [manualAdjustQuantity, setManualAdjustQuantity] = useState('1')
  const [editingItem, setEditingItem] = useState<EditableInventoryItem | null>(
    null
  )
  const [initialCategory, setInitialCategory] = useState('')
  const [initialLocation, setInitialLocation] = useState('')
  const [initialItemType, setInitialItemType] = useState('')
  const [initialUnitOfMeasure, setInitialUnitOfMeasure] = useState('unidad')
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    DEFAULT_INVENTORY_CATEGORIES
  )
  const [availableNames, setAvailableNames] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>(
    DEFAULT_INVENTORY_LOCATIONS
  )
  const [confirmExistingOpen, setConfirmExistingOpen] = useState(false)
  const [confirmExistingItem, setConfirmExistingItem] = useState<InventoryItem | null>(
    null
  )
  const [confirmExistingPayload, setConfirmExistingPayload] =
    useState<SaveInventoryPayload | null>(null)

  const fetchInventoryData = useCallback(async () => {
    setLoading(true)

    try {
      const data = await loadInventoryPageData(selectedBuildingId)

      setProfileId(data.profileId)
      setBuildingId(data.buildingId)
      setBuildingName(data.buildingName)
      setBuildings(data.buildings)
      setItems(data.items)
      setHistory(data.history)
      setAvailableCategories(data.availableCategories)
      setAvailableNames([])
      setAvailableLocations(data.availableLocations)
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      setItems([])
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [selectedBuildingId])

  useEffect(() => {
    void fetchInventoryData()
  }, [fetchInventoryData])

  const {
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleAddCategory,
    handleAddLocation,
    handleAddName,
    useExistingInventoryItem: applyExistingInventoryItemIncrease,
    saveInventoryItem,
    quickAdjustStock,
  } = useInventoryItemActions({
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
  })

  const closeManualAdjustModal = useCallback(() => {
    setManualAdjustOpen(false)
    setManualAdjustSaving(false)
    setManualAdjustItem(null)
    setManualAdjustReason('')
    setManualAdjustQuantity('1')
    setMessage('')
  }, [])

  const closeConfirmExistingModal = useCallback(() => {
    setConfirmExistingOpen(false)
    setConfirmExistingItem(null)
    setConfirmExistingPayload(null)
    setMessage('')
  }, [])

  const handleQuickAdjustStock = useCallback(
    async (item: InventoryItem, change: number) => {
      if (change < 0) {
        setManualAdjustItem(item)
        setManualAdjustReason('')
        setManualAdjustQuantity('1')
        setMessage('')
        setManualAdjustOpen(true)
        return
      }

      await quickAdjustStock(item, change)
    },
    [quickAdjustStock]
  )

  const requestUseExistingInventoryItem = useCallback(
    async (item: InventoryItem, payload: SaveInventoryPayload) => {
      setConfirmExistingItem(item)
      setConfirmExistingPayload(payload)
      setConfirmExistingOpen(true)
      setMessage('')
    },
    []
  )

  const confirmUseExistingInventoryItem = useCallback(async () => {
    if (!confirmExistingItem || !confirmExistingPayload) return

    const success = await applyExistingInventoryItemIncrease(
      confirmExistingItem,
      confirmExistingPayload
    )

    if (success) {
      closeConfirmExistingModal()
    }
  }, [
    closeConfirmExistingModal,
    confirmExistingItem,
    confirmExistingPayload,
    applyExistingInventoryItemIncrease,
  ])

  const confirmManualAdjust = useCallback(async () => {
    if (!manualAdjustItem) return

    if (!manualAdjustReason.trim()) {
      setMessage(manualAdjustT('reasonRequired'))
      return
    }

    const requestedQuantity = Number(manualAdjustQuantity)

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      setMessage(manualAdjustT('invalidQuantity'))
      return
    }

    if (
      !isMaterialInventoryCategory(manualAdjustItem.category) &&
      !Number.isInteger(requestedQuantity)
    ) {
      setMessage(manualAdjustT('wholeUnitsOnly'))
      return
    }

    if (requestedQuantity > Number(manualAdjustItem.quantity ?? 0)) {
      setMessage(manualAdjustT('quantityExceedsAvailable'))
      return
    }

    setManualAdjustSaving(true)
    setMessage('')

    try {
      const success = await quickAdjustStock(manualAdjustItem, -requestedQuantity, {
        note: manualAdjustReason.trim(),
        unitLabel: null,
      })

      if (!success) {
        setMessage(t('couldNotDiscountItem'))
        return
      }

      closeManualAdjustModal()
    } catch (error) {
      console.error('Error confirming manual inventory adjustment:', error)
      setMessage(t('couldNotSaveManualAdjustment'))
    } finally {
      setManualAdjustSaving(false)
    }
  }, [
    closeManualAdjustModal,
    manualAdjustItem,
    manualAdjustQuantity,
    manualAdjustReason,
    quickAdjustStock,
    manualAdjustT,
    t,
  ])

  return {
    scrollRef,

    items,
    history,
    buildingName,
    buildings,
    buildingId,
    profileId,
    loading,
    compactHeader,

    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    conditionFilter,
    setConditionFilter,
    locationFilter,
    setLocationFilter,
    onlyLowStock,
    setOnlyLowStock,
    viewMode,
    setViewMode,

    expandedCategory,
    setExpandedCategory,
    expandedItemId,
    setExpandedItemId,
    photos,
    existingPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,

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
    availableLocations,

    fetchInventoryData,
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleAddCategory,
    handleAddName,
    handleAddLocation,
    useExistingInventoryItem: requestUseExistingInventoryItem,
    closeConfirmExistingModal,
    confirmUseExistingInventoryItem,
    saveInventoryItem,
    quickAdjustStock: handleQuickAdjustStock,
    closeManualAdjustModal,
    confirmManualAdjust,
    clearFilters,
    hasActiveFilters,
  }
}
