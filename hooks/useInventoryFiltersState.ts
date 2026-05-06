'use client'

import { useMemo, useState } from 'react'
import type { InventoryCondition } from '@/lib/inventory/inventoryTypes'

export type ConditionFilter = 'all' | InventoryCondition
export type ViewMode = 'grouped' | 'list'

export default function useInventoryFiltersState() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilter>('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')

  const clearFilters = () => {
    setCategoryFilter('all')
    setConditionFilter('all')
    setLocationFilter('all')
    setOnlyLowStock(false)
    setSearch('')
  }

  const hasActiveFilters = useMemo(
    () =>
      categoryFilter !== 'all' ||
      conditionFilter !== 'all' ||
      locationFilter !== 'all' ||
      onlyLowStock ||
      !!search,
    [categoryFilter, conditionFilter, locationFilter, onlyLowStock, search]
  )

  return {
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
  }
}
