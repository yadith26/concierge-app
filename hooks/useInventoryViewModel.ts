'use client'

import { useCallback, useMemo } from 'react'
import type { InventoryHistory, InventoryItem } from '@/lib/inventory/inventoryTypes'
import type {
  ConditionFilter,
  ViewMode,
} from '@/hooks/useInventoryFiltersState'
import {
  filterInventoryItems,
  getInventoryLowStockCount,
  groupInventoryCategories,
} from '@/lib/inventory/inventoryHelpers'
import { exportInventoryToExcel } from '@/lib/inventory/exportInventory'

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string

type UseInventoryViewModelParams = {
  items: InventoryItem[]
  history: InventoryHistory[]
  buildingName: string
  locale: string
  t: TranslateFn
  search: string
  categoryFilter: string
  conditionFilter: ConditionFilter
  locationFilter: string
  availableCategories: string[]
  availableLocations: string[]
  onlyLowStock: boolean
  viewMode: ViewMode
}

export default function useInventoryViewModel({
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
}: UseInventoryViewModelParams) {
  const filteredItems = useMemo(
    () =>
      filterInventoryItems({
        items,
        search,
        categoryFilter,
        conditionFilter,
        locationFilter,
        onlyLowStock,
      }),
    [
      items,
      search,
      categoryFilter,
      conditionFilter,
      locationFilter,
      onlyLowStock,
    ]
  )

  const groupedCategories = useMemo(
    () =>
      groupInventoryCategories({
        filteredItems,
        availableCategories,
        viewMode,
        search,
        onlyLowStock,
        categoryFilter,
        conditionFilter,
        locationFilter,
        emptyItemsLabel: t('inventoryHelpers.emptyItems'),
        noLocationLabel: t('flatInventoryRow.noLocation'),
      }),
    [
      filteredItems,
      availableCategories,
      viewMode,
      search,
      onlyLowStock,
      categoryFilter,
      conditionFilter,
      locationFilter,
      t,
    ]
  )

  const totalLowStock = useMemo(
    () => getInventoryLowStockCount(items),
    [items]
  )

  const handleExportInventory = useCallback(() => {
    exportInventoryToExcel({
      items: filteredItems,
      history,
      buildingName,
      locale,
      t,
    })
  }, [filteredItems, history, buildingName, locale, t])

  const filteredLocations = useMemo(
    () => availableLocations.filter(Boolean),
    [availableLocations]
  )

  return {
    filteredItems,
    groupedCategories,
    totalLowStock,
    filteredLocations,
    handleExportInventory,
  }
}
