import type {
  PestTarget,
  VisitType,
  WarrantyInput,
  WarrantySummary,
} from '@/lib/tasks/warrantyHelpers'
import {
  findActiveWarrantyForApartmentAndPest,
  getLatestWarrantyByApartmentAndPest,
} from '@/lib/tasks/warrantyHelpers'

export type PestTreatmentRowLike = {
  id: string
  apartment_or_area: string
  apartment_key?: string | null
  pest_target: PestTarget | null
  treatment_visit_type: VisitType | null
  treatment_date: string
  notes: string | null
  created_at: string
}

export type PestGroupSummary<T extends PestTreatmentRowLike> = {
  pestTarget: PestTarget
  totalTreatments: number
  latestDate: string
  history: T[]
  warranty: WarrantySummary | null
}

export type ApartmentSummaryInfo = {
  latestPestTarget: PestTarget | null
  latestVisitType: VisitType | null
  activeWarranty: WarrantySummary | null
  hasRecurrentProblem: boolean
}

export type ApartmentHistorySummary<T extends PestTreatmentRowLike> = {
  apartment: string
  latestDate: string
  totalTreatments: number
  pestGroups: PestGroupSummary<T>[]
  warranties: WarrantySummary[]
  summary: ApartmentSummaryInfo
}

export function parseApartmentLabel(value?: string | null) {
  const raw = (value || '').trim()

  if (!raw) {
    return {
      number: Number.MAX_SAFE_INTEGER,
      suffix: 'zzzz',
      raw: '',
    }
  }

  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^apartamento\s*/i, '')
    .replace(/^apto\s*/i, '')
    .replace(/^apt\s*/i, '')
    .replace(/^apartment\s*/i, '')
    .replace(/^appt\s*/i, '')
    .replace(/^appartement\s*/i, '')
    .replace(/[./\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const match = normalized.match(/^(\d+)\s*([a-z]*)/i)

  if (match) {
    return {
      number: parseInt(match[1], 10),
      suffix: (match[2] || '').toLowerCase(),
      raw: normalized,
    }
  }

  return {
    number: Number.MAX_SAFE_INTEGER,
    suffix: 'zzzz',
    raw: normalized,
  }
}

export function compareApartmentLabels(a?: string | null, b?: string | null) {
  const parsedA = parseApartmentLabel(a)
  const parsedB = parseApartmentLabel(b)

  if (parsedA.number !== parsedB.number) {
    return parsedA.number - parsedB.number
  }

  if (parsedA.suffix !== parsedB.suffix) {
    return parsedA.suffix.localeCompare(parsedB.suffix, 'es', {
      sensitivity: 'base',
    })
  }

  return parsedA.raw.localeCompare(parsedB.raw, 'es', {
    sensitivity: 'base',
  })
}

export function comparePestTargetLabels(
  a: PestTarget | null,
  b: PestTarget | null
) {
  const order: Record<string, number> = {
    cucarachas: 1,
    roedores: 2,
    chinches: 3,
  }

  const valueA = a ? order[a] ?? 999 : 999
  const valueB = b ? order[b] ?? 999 : 999

  return valueA - valueB
}

function isRecurrentProblem<T extends PestTreatmentRowLike>(
  rows: T[],
  pestTarget: PestTarget
) {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setMonth(windowStart.getMonth() - 3)

  const count = rows.filter((item) => {
    if (item.pest_target !== pestTarget) return false
    const date = new Date(`${item.treatment_date}T12:00:00`)
    return date >= windowStart
  }).length

  return count >= 3
}

export function buildGroupedTreatments<T extends PestTreatmentRowLike>(
  rows: T[]
): ApartmentHistorySummary<T>[] {
  const apartmentMap = new Map<string, T[]>()

  for (const item of rows) {
    const groupKey = item.apartment_key?.trim() || item.apartment_or_area.trim()

    if (!apartmentMap.has(groupKey)) {
      apartmentMap.set(groupKey, [])
    }

    apartmentMap.get(groupKey)!.push(item)
  }

  const grouped = Array.from(apartmentMap.entries()).map(
    ([, apartmentHistory]) => {
      const sortedApartmentHistory = [...apartmentHistory].sort((a, b) => {
        const dateCompare =
          new Date(b.treatment_date).getTime() -
          new Date(a.treatment_date).getTime()

        if (dateCompare !== 0) return dateCompare

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })

      const apartmentRef = {
        apartment_or_area: sortedApartmentHistory[0]?.apartment_or_area || '',
        apartment_key: sortedApartmentHistory[0]?.apartment_key || null,
      }

      const warranties = getLatestWarrantyByApartmentAndPest(
        sortedApartmentHistory as WarrantyInput[],
        apartmentRef
      )

      const pestMap = new Map<PestTarget, T[]>()

      for (const item of sortedApartmentHistory) {
        if (!item.pest_target) continue

        if (!pestMap.has(item.pest_target)) {
          pestMap.set(item.pest_target, [])
        }

        pestMap.get(item.pest_target)!.push(item)
      }

      const pestGroups = Array.from(pestMap.entries())
        .map(([pestTarget, pestHistory]) => {
          const sortedPestHistory = [...pestHistory].sort((a, b) => {
            const dateCompare =
              new Date(b.treatment_date).getTime() -
              new Date(a.treatment_date).getTime()

            if (dateCompare !== 0) return dateCompare

            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            )
          })

          return {
            pestTarget,
            totalTreatments: sortedPestHistory.length,
            latestDate: sortedPestHistory[0]?.treatment_date || '',
            history: sortedPestHistory,
            warranty: findActiveWarrantyForApartmentAndPest(
              sortedApartmentHistory as WarrantyInput[],
              apartmentRef,
              pestTarget
            ),
          }
        })
        .sort((a, b) => comparePestTargetLabels(a.pestTarget, b.pestTarget))

      const latestRecord = sortedApartmentHistory[0] || null
      const activeWarranty =
        warranties.find((item) => item.isActive) || null

      const hasRecurrentProblem = pestGroups.some((group) =>
        isRecurrentProblem(sortedApartmentHistory, group.pestTarget)
      )

      return {
        apartment: sortedApartmentHistory[0]?.apartment_or_area || '',
        latestDate: sortedApartmentHistory[0]?.treatment_date || '',
        totalTreatments: sortedApartmentHistory.length,
        pestGroups,
        warranties,
        summary: {
          latestPestTarget: latestRecord?.pest_target || null,
          latestVisitType: latestRecord?.treatment_visit_type || null,
          activeWarranty,
          hasRecurrentProblem,
        },
      }
    }
  )

  return grouped.sort((a, b) => compareApartmentLabels(a.apartment, b.apartment))
}
