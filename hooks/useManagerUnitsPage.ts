'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { fetchBuildingsForUser } from '@/lib/buildings/buildingMembershipService'
import {
  formatApartmentLabel,
  isApartmentReference,
} from '@/lib/locations/normalizeApartment'
import { compareApartmentLabels } from '@/lib/tasks/pestHistoryHelpers'
import type {
  UnitCardSummary,
  UnitHistoryRow,
} from '@/lib/unit-history/unitsWorkbook'

export type UnitGroup = 'apartments' | 'common'
export type BuildingUnitStatus =
  | 'occupied'
  | 'available'
  | 'expiring_soon'
  | 'problematic'
  | 'inactive'

export type BuildingUnitKind =
  | 'apartment'
  | 'common_area'
  | 'garage'
  | 'storage'

export type BuildingUnit = {
  id: string
  building_id: string
  unit_key: string
  unit_label: string
  unit_kind: BuildingUnitKind
  status: BuildingUnitStatus
  floor: string | null
  bedrooms: string | null
  bathrooms: number | null
  size_sqft: number | null
  tenant_name: string | null
  tenant_phone: string | null
  tenant_email: string | null
  lease_start: string | null
  lease_end: string | null
  available_since: string | null
  garage_label: string | null
  storage_label: string | null
  notes: string | null
}

export type BuildingUnitFilter =
  | 'all'
  | 'occupied'
  | 'available'
  | 'expiring_soon'
  | 'problematic'

export type BuildingUnitsSummary = {
  totalApartments: number
  occupied: number
  available: number
  expiringSoon: number
  problematic: number
  garages: number
  storages: number
}

export type ManagerUnitsBuildingSummary = {
  id: string
  name: string
  address: string | null
  invite_code: string | null
  building_photo_url: string | null
}

type ManagerUnitsBuildingRow = {
  id: string
  name: string
  address: string | null
  invite_code: string | null
  building_photo_url?: string | null
}

type RedirectPath = '/login' | '/manager'

type UseManagerUnitsPageParams = {
  buildingId: string
  initialSearch: string
  initialGroup: UnitGroup | null
  initialFilter?: BuildingUnitFilter | null
  onRedirect: (path: RedirectPath) => void
}

function normalizeManagerUnitsBuilding(
  building: ManagerUnitsBuildingRow | null
): ManagerUnitsBuildingSummary | null {
  if (!building) return null

  return {
    id: building.id,
    name: building.name,
    address: building.address ?? null,
    invite_code: building.invite_code ?? null,
    building_photo_url: building.building_photo_url ?? null,
  }
}

async function fetchManagerUnitsBuilding(buildingId: string) {
  let response = await supabase
    .from('buildings_new')
    .select('id, name, address, invite_code, building_photo_url')
    .eq('id', buildingId)
    .maybeSingle()

  if (response.error?.message?.includes('building_photo_url')) {
    response = await supabase
      .from('buildings_new')
      .select('id, name, address, invite_code')
      .eq('id', buildingId)
      .maybeSingle()
  }

  return response
}

export function buildUnitsHref(params: {
  buildingId: string
  unitKey: string
  search: string
  group: UnitGroup | null
}) {
  const query = new URLSearchParams()

  if (params.search.trim()) {
    query.set('search', params.search)
  }

  if (params.group) {
    query.set('group', params.group)
  }

  const suffix = query.toString()
  return suffix
    ? `/manager/buildings/${params.buildingId}/units/${params.unitKey}?${suffix}`
    : `/manager/buildings/${params.buildingId}/units/${params.unitKey}`
}

export function useManagerUnitsPage({
  buildingId,
  initialFilter,
  initialSearch,
  initialGroup,
  onRedirect,
}: UseManagerUnitsPageParams) {
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] =
    useState<ManagerUnitsBuildingSummary | null>(null)
  const [buildings, setBuildings] = useState<ManagerUnitsBuildingSummary[]>([])
  const [units, setUnits] = useState<UnitCardSummary[]>([])
  const [buildingUnits, setBuildingUnits] = useState<BuildingUnit[]>([])
  const [unitHistoryRows, setUnitHistoryRows] = useState<UnitHistoryRow[]>([])
  const [search, setSearch] = useState(initialSearch)
  const [activeGroup, setActiveGroup] = useState<UnitGroup | null>(initialGroup)
  const [unitFilter, setUnitFilter] = useState<BuildingUnitFilter>(
    initialFilter || 'all'
  )

  const fetchUnits = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await getSafeAuthUser()

    if (userError || !user) {
      onRedirect('/login')
      return
    }

    const { data: membership } = await supabase
      .from('building_users')
      .select('id')
      .eq('building_id', buildingId)
      .eq('user_id', user.id)
      .eq('role', 'manager')
      .maybeSingle()

    if (!membership) {
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
      { data: buildingUnitsData, error: buildingUnitsError },
      { data: unitHistoryData, error: unitHistoryError },
    ] = await Promise.all([
      fetchManagerUnitsBuilding(buildingId),
      supabase
        .from('building_units')
        .select(
          'id, building_id, unit_key, unit_label, unit_kind, status, floor, bedrooms, bathrooms, size_sqft, tenant_name, tenant_phone, tenant_email, lease_start, lease_end, available_since, garage_label, storage_label, notes'
        )
        .eq('building_id', buildingId)
        .order('unit_label', { ascending: true }),
      supabase
        .from('unit_history')
        .select(
          'unit_key, unit_label, event_type, event_category, title, description, happened_at, source_table'
        )
        .eq('building_id', buildingId)
        .order('happened_at', { ascending: false }),
    ])

    if (buildingError) {
      console.error('Error loading building:', buildingError)
    }

    if (unitHistoryError) {
      console.error('Error loading unit history:', unitHistoryError)
    }

    if (buildingUnitsError) {
      console.error('Error loading building units:', buildingUnitsError)
    }

    setBuilding(
      normalizeManagerUnitsBuilding(
        (buildingData as ManagerUnitsBuildingRow | null) ?? null
      )
    )
    setBuildingUnits((buildingUnitsData as BuildingUnit[]) ?? [])

    const rows =
      ((unitHistoryData as UnitHistoryRow[]) ?? []).map((row) => ({
        ...row,
        unit_label: isApartmentReference(row.unit_label)
          ? formatApartmentLabel(row.unit_label)
          : row.unit_label,
      }))
    setUnitHistoryRows(rows)

    const summaryMap = new Map<string, UnitCardSummary>()

    for (const row of rows) {
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

    setUnits(Array.from(summaryMap.values()))
    setLoading(false)
  }, [buildingId, onRedirect])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUnits()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchUnits])

  const sortedApartments = useMemo(() => {
    return [...units]
      .filter((unit) => isApartmentReference(unit.unitLabel))
      .sort((a, b) => compareApartmentLabels(a.unitLabel, b.unitLabel))
  }, [units])

  const sortedCommonAreas = useMemo(() => {
    return [...units]
      .filter((unit) => !isApartmentReference(unit.unitLabel))
      .sort((a, b) =>
        a.unitLabel.localeCompare(b.unitLabel, 'en', { sensitivity: 'base' })
      )
  }, [units])

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (query) {
      return [...sortedApartments, ...sortedCommonAreas].filter((unit) =>
        [unit.unitLabel, unit.lastEventTitle, unit.lastEventCategory]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      )
    }

    const source =
      activeGroup === 'apartments'
        ? sortedApartments
        : activeGroup === 'common'
          ? sortedCommonAreas
          : []

    return source
  }, [activeGroup, search, sortedApartments, sortedCommonAreas])

  const unitSummary = useMemo<BuildingUnitsSummary>(() => {
    const apartmentUnits = buildingUnits.filter(
      (unit) => unit.unit_kind === 'apartment'
    )

    return {
      available: apartmentUnits.filter((unit) => unit.status === 'available')
        .length,
      expiringSoon: apartmentUnits.filter(
        (unit) => unit.status === 'expiring_soon'
      ).length,
      garages: buildingUnits.filter((unit) => unit.garage_label?.trim()).length,
      occupied: apartmentUnits.filter((unit) => unit.status === 'occupied')
        .length,
      problematic: apartmentUnits.filter(
        (unit) => unit.status === 'problematic'
      ).length,
      storages: buildingUnits.filter((unit) => unit.storage_label?.trim()).length,
      totalApartments: apartmentUnits.length,
    }
  }, [buildingUnits])

  const sortedBuildingUnits = useMemo(() => {
    return [...buildingUnits]
      .filter((unit) => unit.unit_kind === 'apartment')
      .sort((a, b) => compareApartmentLabels(a.unit_label, b.unit_label))
  }, [buildingUnits])

  const filteredBuildingUnits = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sortedBuildingUnits.filter((unit) => {
      const matchesFilter =
        unitFilter === 'all' ? true : unit.status === unitFilter

      if (!matchesFilter) return false

      if (!query) return true

      return [
        unit.unit_label,
        unit.tenant_name,
        unit.tenant_phone,
        unit.tenant_email,
        unit.garage_label,
        unit.storage_label,
        unit.notes,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    })
  }, [search, sortedBuildingUnits, unitFilter])

  return {
    activeGroup,
    building,
    buildingUnits,
    buildings,
    filteredBuildingUnits,
    filteredUnits,
    loading,
    search,
    setActiveGroup,
    setSearch,
    setUnitFilter,
    sortedApartments,
    sortedBuildingUnits,
    sortedCommonAreas,
    unitFilter,
    unitHistoryRows,
    unitSummary,
    units,
    refresh: fetchUnits,
  }
}
