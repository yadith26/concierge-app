import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { supabase } from '@/lib/supabase'
import {
  formatApartmentLabel,
  normalizeApartmentKey,
} from '@/lib/locations/normalizeApartment'
import type {
  BuildingUnit,
  BuildingUnitKind,
  BuildingUnitStatus,
} from '@/hooks/useManagerUnitsPage'

export type BuildingUnitFormValues = {
  unitLabel: string
  unitKind: BuildingUnitKind
  status: BuildingUnitStatus
  floor: string
  bedrooms: string
  bathrooms: string
  sizeSqft: string
  tenantName: string
  tenantPhone: string
  tenantEmail: string
  leaseStart: string
  leaseEnd: string
  availableSince: string
  garageLabel: string
  storageLabel: string
  notes: string
}

function normalizeGenericUnitKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[./\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '')
}

function normalizeUnitIdentity(values: BuildingUnitFormValues) {
  const rawLabel = values.unitLabel.trim()
  const unitLabel =
    values.unitKind === 'apartment' ? formatApartmentLabel(rawLabel) : rawLabel
  const unitKey =
    values.unitKind === 'apartment'
      ? normalizeApartmentKey(unitLabel)
      : normalizeGenericUnitKey(unitLabel)

  return { unitKey, unitLabel }
}

function toNullableString(value: string) {
  const cleanValue = value.trim()
  return cleanValue ? cleanValue : null
}

function toNullableNumber(value: string) {
  if (!value.trim()) return null

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export function calculateLeaseEndFromStart(leaseStart: string) {
  if (!leaseStart) return ''

  const startDate = new Date(`${leaseStart}T12:00:00`)
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)

  return formatDateKey(addDays(endDate, -1))
}

export function calculateRenewedLeaseDates(leaseEnd: string) {
  if (!leaseEnd) return { leaseEnd: '', leaseStart: '' }

  const currentEndDate = new Date(`${leaseEnd}T12:00:00`)
  const nextStartDate = addDays(currentEndDate, 1)

  return {
    leaseStart: formatDateKey(nextStartDate),
    leaseEnd: calculateLeaseEndFromStart(formatDateKey(nextStartDate)),
  }
}

function getDaysUntilLeaseEnd(leaseEnd: string) {
  if (!leaseEnd) return null

  const today = new Date()
  const endDate = new Date(`${leaseEnd}T12:00:00`)

  return Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function hasOccupancyDetails(values: BuildingUnitFormValues) {
  return Boolean(
    values.tenantName.trim() ||
      values.tenantPhone.trim() ||
      values.tenantEmail.trim() ||
      values.leaseStart ||
      values.leaseEnd
  )
}

function normalizeLeaseValues(values: BuildingUnitFormValues) {
  const leaseValues = {
    leaseStart: values.leaseStart,
    leaseEnd:
      values.leaseEnd || values.leaseStart
        ? values.leaseEnd || calculateLeaseEndFromStart(values.leaseStart)
        : '',
  }

  if (leaseValues.leaseStart && leaseValues.leaseEnd) {
    const startDate = new Date(`${leaseValues.leaseStart}T12:00:00`)
    const endDate = new Date(`${leaseValues.leaseEnd}T12:00:00`)

    if (endDate < startDate) {
      throw new Error(
        'La fecha de fin del contrato no puede ser anterior a la fecha de inicio.'
      )
    }
  }

  return leaseValues
}

function resolveUnitStatus(values: BuildingUnitFormValues, leaseEnd: string) {
  if (values.status === 'problematic' || values.status === 'inactive') {
    return values.status
  }

  const daysUntilLeaseEnd = getDaysUntilLeaseEnd(leaseEnd)

  if (daysUntilLeaseEnd !== null && daysUntilLeaseEnd <= 90) {
    return 'expiring_soon'
  }

  if (
    (values.status === 'available' || values.status === 'expiring_soon') &&
    hasOccupancyDetails(values)
  ) {
    return 'occupied'
  }

  return values.status
}

function buildPayload({
  buildingId,
  createdBy,
  values,
}: {
  buildingId: string
  createdBy?: string
  values: BuildingUnitFormValues
}) {
  const { unitKey, unitLabel } = normalizeUnitIdentity(values)
  const leaseValues = normalizeLeaseValues(values)
  const status = resolveUnitStatus(values, leaseValues.leaseEnd)

  if (!unitLabel || !unitKey) {
    throw new Error('Escribe el nombre o numero de la unidad.')
  }

  return {
    available_since: status === 'available' ? values.availableSince || null : null,
    bathrooms: toNullableNumber(values.bathrooms),
    bedrooms: toNullableString(values.bedrooms),
    building_id: buildingId,
    created_by: createdBy,
    floor: toNullableString(values.floor),
    garage_label: toNullableString(values.garageLabel),
    lease_end: leaseValues.leaseEnd || null,
    lease_start: leaseValues.leaseStart || null,
    notes: toNullableString(values.notes),
    size_sqft: toNullableNumber(values.sizeSqft),
    status,
    storage_label: toNullableString(values.storageLabel),
    tenant_email: toNullableString(values.tenantEmail),
    tenant_name: toNullableString(values.tenantName),
    tenant_phone: toNullableString(values.tenantPhone),
    unit_key: unitKey,
    unit_kind: values.unitKind,
    unit_label: unitLabel,
  }
}

export function buildUnitFormInitialValues(
  unit?: BuildingUnit | null
): BuildingUnitFormValues {
  return {
    availableSince: unit?.available_since || '',
    bathrooms: unit?.bathrooms ? String(unit.bathrooms) : '',
    bedrooms: unit?.bedrooms || '',
    floor: unit?.floor || '',
    garageLabel: unit?.garage_label || '',
    leaseEnd: unit?.lease_end || '',
    leaseStart: unit?.lease_start || '',
    notes: unit?.notes || '',
    sizeSqft: unit?.size_sqft ? String(unit.size_sqft) : '',
    status: unit?.status || 'available',
    storageLabel: unit?.storage_label || '',
    tenantEmail: unit?.tenant_email || '',
    tenantName: unit?.tenant_name || '',
    tenantPhone: unit?.tenant_phone || '',
    unitKind: unit?.unit_kind || 'apartment',
    unitLabel: unit?.unit_label || '',
  }
}

export async function createBuildingUnit({
  buildingId,
  values,
}: {
  buildingId: string
  values: BuildingUnitFormValues
}) {
  const {
    data: { user },
  } = await getSafeAuthUser()

  if (!user) {
    throw new Error('No se pudo identificar el usuario.')
  }

  const payload = buildPayload({
    buildingId,
    createdBy: user.id,
    values,
  })

  const { error } = await supabase.from('building_units').insert(payload)

  if (error) {
    throw new Error(error.message || 'No se pudo crear la unidad.')
  }
}

export async function updateBuildingUnit({
  buildingId,
  unitId,
  values,
}: {
  buildingId: string
  unitId: string
  values: BuildingUnitFormValues
}) {
  const payload = buildPayload({ buildingId, values })
  delete payload.created_by

  const { error } = await supabase
    .from('building_units')
    .update(payload)
    .eq('id', unitId)
    .eq('building_id', buildingId)

  if (error) {
    throw new Error(error.message || 'No se pudo guardar la unidad.')
  }
}
