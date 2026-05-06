export type PestTarget = 'cucarachas' | 'roedores' | 'chinches'
export type VisitType = 'nuevo' | 'seguimiento' | 'preventivo'

export type WarrantyInput = {
  apartment_or_area: string
  apartment_key?: string | null
  pest_target: PestTarget | null
  treatment_visit_type: VisitType | null
  treatment_date: string
}

export type WarrantySummary = {
  pestTarget: PestTarget
  startDate: string
  endDate: string
  isActive: boolean
}

function addOneYear(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  const next = new Date(year, (month || 1) - 1, day || 1)
  next.setFullYear(next.getFullYear() + 1)

  const yyyy = next.getFullYear()
  const mm = String(next.getMonth() + 1).padStart(2, '0')
  const dd = String(next.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function todayDateString() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function normalizeApartmentKey(value: string) {
  return value.trim().toLowerCase()
}

export function resolveApartmentKey(input: {
  apartment_key?: string | null
  apartment_or_area: string
}) {
  return normalizeApartmentKey(
    input.apartment_key?.trim() || input.apartment_or_area
  )
}

export function createsWarranty(visitType: VisitType | null) {
  return visitType === 'nuevo' || visitType === 'preventivo'
}

export function getWarrantyEndDate(startDate: string) {
  return addOneYear(startDate)
}

export function isWarrantyActive(endDate: string, referenceDate?: string) {
  const ref = referenceDate || todayDateString()

  return (
    new Date(`${endDate}T23:59:59`).getTime() >=
    new Date(`${ref}T00:00:00`).getTime()
  )
}

export function getLatestWarrantyByPest(
  history: WarrantyInput[]
): WarrantySummary[] {
  const map = new Map<PestTarget, WarrantyInput>()

  for (const item of history) {
    if (!item.pest_target) continue
    if (!createsWarranty(item.treatment_visit_type)) continue

    const existing = map.get(item.pest_target)

    if (!existing) {
      map.set(item.pest_target, item)
      continue
    }

    if (
      new Date(item.treatment_date).getTime() >
      new Date(existing.treatment_date).getTime()
    ) {
      map.set(item.pest_target, item)
    }
  }

  return Array.from(map.entries())
    .map(([pestTarget, item]) => {
      const endDate = getWarrantyEndDate(item.treatment_date)

      return {
        pestTarget,
        startDate: item.treatment_date,
        endDate,
        isActive: isWarrantyActive(endDate),
      }
    })
    .sort((a, b) => a.pestTarget.localeCompare(b.pestTarget))
}

export function getLatestWarrantyByApartmentAndPest(
  history: WarrantyInput[],
  apartment: {
    apartment_key?: string | null
    apartment_or_area: string
  }
): WarrantySummary[] {
  const apartmentKey = resolveApartmentKey(apartment)

  return getLatestWarrantyByPest(
    history.filter((item) => resolveApartmentKey(item) === apartmentKey)
  )
}

export function findLatestWarrantyForApartmentAndPest(
  history: WarrantyInput[],
  apartment: {
    apartment_key?: string | null
    apartment_or_area: string
  },
  pestTarget: PestTarget
) {
  const apartmentKey = resolveApartmentKey(apartment)

  const matches = history
    .filter((item) => item.pest_target === pestTarget)
    .filter((item) => createsWarranty(item.treatment_visit_type))
    .filter((item) => resolveApartmentKey(item) === apartmentKey)
    .sort(
      (a, b) =>
        new Date(b.treatment_date).getTime() -
        new Date(a.treatment_date).getTime()
    )

  if (matches.length === 0) return null

  const latest = matches[0]
  const endDate = getWarrantyEndDate(latest.treatment_date)

  return {
    pestTarget,
    startDate: latest.treatment_date,
    endDate,
    isActive: isWarrantyActive(endDate),
  }
}

export function findActiveWarrantyForApartmentAndPest(
  history: WarrantyInput[],
  apartment: {
    apartment_key?: string | null
    apartment_or_area: string
  },
  pestTarget: PestTarget
) {
  const latest = findLatestWarrantyForApartmentAndPest(
    history,
    apartment,
    pestTarget
  )

  if (!latest) return null
  if (!latest.isActive) return null

  return latest
}