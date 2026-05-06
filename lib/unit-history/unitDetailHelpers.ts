'use client'

import type { ReactNode } from 'react'

export type UnitHistoryEntry = {
  id: string
  unit_key: string
  unit_label: string
  event_type: string
  event_category: string
  title: string
  description: string | null
  happened_at: string
  metadata: Record<string, unknown>
}

export type CategoryGroup = {
  key: string
  label: string
  summaryLabel: string
  icon: ReactNode
  entries: UnitHistoryEntry[]
}

export type YearGroup = {
  year: string
  groups: CategoryGroup[]
}

export type UnitSummary = {
  paint: UnitHistoryEntry | null
  change: UnitHistoryEntry | null
  repair: UnitHistoryEntry | null
  pest: UnitHistoryEntry | null
}

export function formatUnitHistoryDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatUnitHistoryCategory(value: string) {
  if (value === 'paint') return 'Trabajos de pintura'
  if (value === 'change') return 'Reemplazo'
  if (value === 'delivery') return 'Reemplazo'
  if (value === 'repair') return 'Reparacion'
  if (value === 'inspection') return 'Inspeccion'
  if (value === 'pest') return 'Control de plagas'
  return 'Historial'
}

export function buildUnitSummary(entries: UnitHistoryEntry[]): UnitSummary {
  return {
    paint: entries.find((entry) => entry.event_category === 'paint') || null,
    change:
      entries.find(
        (entry) =>
          entry.event_category === 'change' ||
          entry.event_category === 'delivery'
      ) || null,
    repair: entries.find((entry) => entry.event_category === 'repair') || null,
    pest: entries.find((entry) => entry.event_category === 'pest') || null,
  }
}

export function buildEntriesByYear(
  entries: UnitHistoryEntry[],
  icons: {
    paint: ReactNode
    repair: ReactNode
    change: ReactNode
    pest: ReactNode
  }
): YearGroup[] {
  const map = new Map<string, UnitHistoryEntry[]>()

  for (const entry of entries) {
    const year = new Date(`${entry.happened_at}T12:00:00`).getFullYear().toString()
    if (!map.has(year)) {
      map.set(year, [])
    }
    map.get(year)!.push(entry)
  }

  return Array.from(map.entries()).map(([year, yearEntries]) => {
    const groups: CategoryGroup[] = [
      {
        key: 'paint',
        label: 'Trabajos de pintura',
        summaryLabel: 'Ultima pintura',
        icon: icons.paint,
        entries: yearEntries.filter((entry) => entry.event_category === 'paint'),
      },
      {
        key: 'repair',
        label: 'Reparaciones',
        summaryLabel: 'Ultima reparacion',
        icon: icons.repair,
        entries: yearEntries.filter((entry) => entry.event_category === 'repair'),
      },
      {
        key: 'change',
        label: 'Reemplazos',
        summaryLabel: 'Ultimo reemplazo',
        icon: icons.change,
        entries: yearEntries.filter(
          (entry) =>
            entry.event_category === 'change' ||
            entry.event_category === 'delivery'
        ),
      },
      {
        key: 'pest',
        label: 'Control de plagas',
        summaryLabel: 'Ultimo control de plagas',
        icon: icons.pest,
        entries: yearEntries.filter((entry) => entry.event_category === 'pest'),
      },
    ].filter((group) => group.entries.length > 0)

    return { year, groups }
  })
}
