import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import type {
  ConditionFilter,
  ViewMode,
} from '@/hooks/useInventoryFiltersState'
import {
  getInventoryLocationLabel,
  isLowStockItem,
} from '@/lib/inventory/inventoryUi'

type FilterInventoryItemsParams = {
  items: InventoryItem[]
  search: string
  categoryFilter?: string
  conditionFilter?: ConditionFilter
  locationFilter?: string
  onlyLowStock?: boolean
}

type GroupInventoryCategoriesParams = {
  filteredItems: InventoryItem[]
  availableCategories: string[]
  viewMode: ViewMode
  search: string
  onlyLowStock: boolean
  categoryFilter?: string
  conditionFilter: ConditionFilter
  locationFilter: string
  emptyItemsLabel: string
  noLocationLabel: string
}

export type InventoryCategoryGroup = {
  category: string
  items: InventoryItem[]
  totalUnits: number
  totalItems: number
  locationSummary: string
}

export function filterInventoryItems({
  items,
  search,
  categoryFilter = 'all',
  conditionFilter = 'all',
  locationFilter = 'all',
  onlyLowStock = false,
}: FilterInventoryItemsParams) {
  const searchValue = search.toLowerCase().trim()

  return items
    .filter((item) => Number(item.quantity || 0) > 0)
    .filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.name.toLowerCase().includes(searchValue) ||
        (item.item_type || '').toLowerCase().includes(searchValue) ||
        (item.location || '').toLowerCase().includes(searchValue) ||
        (item.notes || '').toLowerCase().includes(searchValue) ||
        (item.category || '').toLowerCase().includes(searchValue)

      const matchesCondition =
        conditionFilter === 'all' ? true : item.condition === conditionFilter

      const matchesCategory =
        categoryFilter === 'all'
          ? true
          : (item.category || '').trim().toLowerCase() ===
            categoryFilter.toLowerCase()

      const matchesLocation =
        locationFilter === 'all'
          ? true
          : (item.location || '').trim().toLowerCase() ===
            locationFilter.toLowerCase()

      const matchesLowStock = onlyLowStock
        ? isLowStockItem(item.quantity, item.minimum_stock)
        : true

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCondition &&
        matchesLocation &&
        matchesLowStock
      )
    })
    .sort((a, b) => {
      const lowStockA = isLowStockItem(a.quantity, a.minimum_stock) ? 0 : 1
      const lowStockB = isLowStockItem(b.quantity, b.minimum_stock) ? 0 : 1

      if (lowStockA !== lowStockB) return lowStockA - lowStockB

      if ((a.category || '') !== (b.category || '')) {
        return (a.category || '').localeCompare(b.category || '')
      }

      return a.name.localeCompare(b.name)
    })
}

export function groupInventoryCategories({
  filteredItems,
  availableCategories,
  viewMode,
  search,
  onlyLowStock,
  categoryFilter = 'all',
  conditionFilter,
  locationFilter,
  emptyItemsLabel,
  noLocationLabel,
}: GroupInventoryCategoriesParams): InventoryCategoryGroup[] {
  const allCategories = new Set<string>(availableCategories)

  filteredItems.forEach((item) => {
    const value = item.category?.trim()
    if (value) allCategories.add(value)
  })

  return Array.from(allCategories)
    .map((category) => {
      const categoryItems = filteredItems
        .filter(
          (item) =>
            (item.category || '').trim().toLowerCase() ===
            category.toLowerCase()
        )
        .sort((a, b) => a.name.localeCompare(b.name))

      const totalUnits = categoryItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      )

      const locationSummary =
        categoryItems.length > 0
          ? getInventoryLocationLabel(
              categoryItems[0]?.location,
              noLocationLabel
            )
          : emptyItemsLabel

      return {
        category,
        items: categoryItems,
        totalUnits,
        totalItems: categoryItems.length,
        locationSummary,
      }
    })
    .filter((group) =>
      viewMode === 'grouped'
        ? group.items.length > 0 ||
          (!search &&
            !onlyLowStock &&
            categoryFilter === 'all' &&
            conditionFilter === 'all' &&
            locationFilter === 'all')
        : group.items.length > 0
    )
    .sort((a, b) => a.category.localeCompare(b.category))
}

export function getInventoryLowStockCount(items: InventoryItem[]) {
  return items.filter((item) =>
    isLowStockItem(item.quantity, item.minimum_stock)
  ).length
}
