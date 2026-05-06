'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { fetchBuildingsForUser } from '@/lib/buildings/buildingMembershipService'
import {
  formatApartmentLabel,
  isApartmentReference,
} from '@/lib/locations/normalizeApartment'
import {
  filterInventoryItems,
  getInventoryLowStockCount,
  groupInventoryCategories,
} from '@/lib/inventory/inventoryHelpers'
import { buildGroupedTreatments } from '@/lib/tasks/pestHistoryHelpers'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'
import { compareApartmentLabels } from '@/lib/tasks/pestHistoryHelpers'
import type {
  ConditionFilter,
  ViewMode,
} from '@/hooks/useInventoryFiltersState'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type {
  UnitCardSummary,
  UnitHistoryRow,
} from '@/lib/unit-history/unitsWorkbook'

export type RecordsTab = 'inventory' | 'treatments' | 'units'

export type ManagerRecordsBuildingSummary = {
  id: string
  name: string
  address: string | null
}

type RedirectPath = '/login' | '/manager'

type UseManagerRecordsPageParams = {
  buildingId: string
  onRedirect: (path: RedirectPath) => void
}

export function useManagerRecordsPage({
  buildingId,
  onRedirect,
}: UseManagerRecordsPageParams) {
  const [tab, setTab] = useState<RecordsTab>('inventory')
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] =
    useState<ManagerRecordsBuildingSummary | null>(null)
  const [buildings, setBuildings] = useState<ManagerRecordsBuildingSummary[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [treatments, setTreatments] = useState<PestTreatmentRow[]>([])
  const [unitHistoryRows, setUnitHistoryRows] = useState<UnitHistoryRow[]>([])

  const [inventorySearch, setInventorySearch] = useState('')
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilter>('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')

  const [treatmentSearch, setTreatmentSearch] = useState('')
  const [pestFilter, setPestFilter] = useState<'all' | PestTarget>('all')
  const [visitFilter, setVisitFilter] =
    useState<'all' | TreatmentVisitType>('all')
  const [expandedApartment, setExpandedApartment] = useState<string | null>(null)

  const fetchRecordsData = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await getSafeAuthUser()

    if (userError || !user) {
      onRedirect('/login')
      return
    }

    const { data: membership, error: membershipError } = await supabase
      .from('building_users')
      .select('building_id')
      .eq('building_id', buildingId)
      .eq('user_id', user.id)
      .eq('role', 'manager')
      .maybeSingle()

    if (membershipError || !membership) {
      onRedirect('/manager')
      return
    }

    const nextBuildings = await fetchBuildingsForUser({
      userId: user.id,
      role: 'manager',
    })
    setBuildings(nextBuildings)

    const [
      { data: buildingData, error: buildingError },
      { data: inventoryData, error: inventoryError },
      { data: treatmentData, error: treatmentError },
      { data: unitHistoryData, error: unitHistoryError },
    ] = await Promise.all([
      supabase
        .from('buildings_new')
        .select('id, name, address')
        .eq('id', buildingId)
        .maybeSingle(),
      supabase
        .from('inventory_items')
        .select('*')
        .eq('building_id', buildingId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('pest_treatments')
        .select('*')
        .eq('building_id', buildingId)
        .order('treatment_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('unit_history')
        .select(
          'unit_key, unit_label, event_type, event_category, title, description, happened_at, source_table'
        )
        .eq('building_id', buildingId)
        .order('happened_at', { ascending: false }),
    ])

    if (buildingError) console.error('Error loading building:', buildingError)
    if (inventoryError) console.error('Error loading inventory:', inventoryError)
    if (treatmentError) console.error('Error loading treatments:', treatmentError)
    if (unitHistoryError) console.error('Error loading unit history:', unitHistoryError)

    setBuilding(
      (buildingData as ManagerRecordsBuildingSummary | null) ?? null
    )
    setInventoryItems((inventoryData as InventoryItem[]) ?? [])
    setTreatments((treatmentData as PestTreatmentRow[]) ?? [])
    setUnitHistoryRows(
      ((unitHistoryData as UnitHistoryRow[]) ?? []).map((row) => ({
        ...row,
        unit_label: isApartmentReference(row.unit_label)
          ? formatApartmentLabel(row.unit_label)
          : row.unit_label,
      }))
    )
    setLoading(false)
  }, [buildingId, onRedirect])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRecordsData()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [fetchRecordsData])

  const filteredInventory = useMemo(
    () =>
      filterInventoryItems({
        items: inventoryItems,
        search: inventorySearch,
        conditionFilter,
        locationFilter,
        onlyLowStock,
      }),
    [
      inventoryItems,
      inventorySearch,
      conditionFilter,
      locationFilter,
      onlyLowStock,
    ]
  )

  const groupedCategories = useMemo(
    () =>
      groupInventoryCategories({
        filteredItems: filteredInventory,
        availableCategories: Array.from(
          new Set(
            inventoryItems
              .map((item) => item.category?.trim())
              .filter((value): value is string => Boolean(value))
          )
        ),
        viewMode,
        search: inventorySearch,
        onlyLowStock,
        conditionFilter,
        locationFilter,
        emptyItemsLabel: 'No items',
        noLocationLabel: 'No location',
      }),
    [
      filteredInventory,
      inventoryItems,
      viewMode,
      inventorySearch,
      onlyLowStock,
      conditionFilter,
      locationFilter,
    ]
  )

  const totalLowStock = useMemo(
    () => getInventoryLowStockCount(inventoryItems),
    [inventoryItems]
  )

  const hasInventoryFilters =
    conditionFilter !== 'all' ||
    locationFilter !== 'all' ||
    onlyLowStock ||
    Boolean(inventorySearch)

  const filteredTreatments = useMemo(() => {
    const query = treatmentSearch.trim().toLowerCase()

    return treatments.filter((item) => {
      const matchesSearch =
        !query ||
        item.apartment_or_area.toLowerCase().includes(query) ||
        (item.notes || '').toLowerCase().includes(query)

      const matchesPest =
        pestFilter === 'all' ? true : item.pest_target === pestFilter

      const matchesVisit =
        visitFilter === 'all'
          ? true
          : item.treatment_visit_type === visitFilter

      return matchesSearch && matchesPest && matchesVisit
    })
  }, [treatments, treatmentSearch, pestFilter, visitFilter])

  const groupedTreatments = useMemo(
    () => buildGroupedTreatments(filteredTreatments),
    [filteredTreatments]
  )

  const unitSummaries = useMemo(() => {
    const summaryMap = new Map<string, UnitCardSummary>()

    for (const row of unitHistoryRows) {
      if (!summaryMap.has(row.unit_key)) {
        summaryMap.set(row.unit_key, {
          unitKey: row.unit_key,
          unitLabel: row.unit_label,
          totalEvents: 0,
          lastEventTitle: row.title,
          lastEventDate: row.happened_at,
          lastEventCategory: row.event_category,
        })
      }

      const current = summaryMap.get(row.unit_key)!
      current.totalEvents += 1
    }

    return Array.from(summaryMap.values())
  }, [unitHistoryRows])

  const apartmentSummaries = useMemo(
    () =>
      unitSummaries
        .filter((unit) => isApartmentReference(unit.unitLabel))
        .sort((a, b) => compareApartmentLabels(a.unitLabel, b.unitLabel)),
    [unitSummaries]
  )

  const commonSummaries = useMemo(
    () =>
      unitSummaries
        .filter((unit) => !isApartmentReference(unit.unitLabel))
        .sort((a, b) =>
          a.unitLabel.localeCompare(b.unitLabel, 'en', { sensitivity: 'base' })
        ),
    [unitSummaries]
  )

  const clearInventoryFilters = useCallback(() => {
    setInventorySearch('')
    setConditionFilter('all')
    setLocationFilter('all')
    setOnlyLowStock(false)
  }, [])

  const updateTreatmentSearch = useCallback((value: string) => {
    setTreatmentSearch(value)
    setExpandedApartment(null)
  }, [])

  const updatePestFilter = useCallback((value: 'all' | PestTarget) => {
    setPestFilter(value)
    setExpandedApartment(null)
  }, [])

  const updateVisitFilter = useCallback((value: 'all' | TreatmentVisitType) => {
    setVisitFilter(value)
    setExpandedApartment(null)
  }, [])

  const toggleApartment = useCallback((apartment: string) => {
    setExpandedApartment((prev) => (prev === apartment ? null : apartment))
  }, [])

  return {
    apartmentSummaries,
    building,
    buildings,
    clearInventoryFilters,
    commonSummaries,
    conditionFilter,
    expandedApartment,
    filteredInventory,
    filteredTreatments,
    groupedCategories,
    groupedTreatments,
    hasInventoryFilters,
    inventorySearch,
    loading,
    onlyLowStock,
    pestFilter,
    setConditionFilter,
    setInventorySearch,
    setOnlyLowStock,
    setTab,
    setViewMode,
    tab,
    toggleApartment,
    totalLowStock,
    treatmentSearch,
    unitHistoryRows,
    updatePestFilter,
    updateTreatmentSearch,
    updateVisitFilter,
    viewMode,
    visitFilter,
  }
}
