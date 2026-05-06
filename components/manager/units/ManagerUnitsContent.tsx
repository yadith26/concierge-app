'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  Car,
  Clock3,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  SlidersHorizontal,
  User,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  buildUnitsHref,
  type BuildingUnit,
  type BuildingUnitFilter,
  type BuildingUnitsSummary,
  type UnitGroup,
} from '@/hooks/useManagerUnitsPage'
import type { UnitCardSummary } from '@/lib/unit-history/unitsWorkbook'

type ManagerUnitsContentProps = {
  activeGroup: UnitGroup | null
  buildingId: string
  filteredBuildingUnits: BuildingUnit[]
  filteredUnits: UnitCardSummary[]
  search: string
  sortedApartments: UnitCardSummary[]
  sortedBuildingUnits: BuildingUnit[]
  sortedCommonAreas: UnitCardSummary[]
  unitFilter: BuildingUnitFilter
  onSearchChange: (value: string) => void
  onGroupChange: (group: UnitGroup) => void
  onEditUnit: (unit: BuildingUnit) => void
  onUnitFilterChange: (filter: BuildingUnitFilter) => void
}

const FILTERS: Array<{
  id: BuildingUnitFilter
  label: string
  shortLabel: string
}> = [
  { id: 'all', label: 'Todos', shortLabel: 'Todos' },
  { id: 'occupied', label: 'Ocupados', shortLabel: 'Ocupados' },
  { id: 'available', label: 'Disponibles', shortLabel: 'Libres' },
  { id: 'expiring_soon', label: 'Proximos a vencer', shortLabel: 'Vencen' },
  { id: 'problematic', label: 'Problematicos', shortLabel: 'Problemas' },
]

export default function ManagerUnitsContent({
  buildingId,
  filteredBuildingUnits,
  filteredUnits,
  search,
  sortedApartments,
  sortedBuildingUnits,
  sortedCommonAreas,
  unitFilter,
  onEditUnit,
  onSearchChange,
  onUnitFilterChange,
}: ManagerUnitsContentProps) {
  const hasStructuredUnits = sortedBuildingUnits.length > 0
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterCounts = useMemo(
    () => ({
      all: sortedBuildingUnits.length,
      available: sortedBuildingUnits.filter((unit) => unit.status === 'available')
        .length,
      expiring_soon: sortedBuildingUnits.filter(
        (unit) => unit.status === 'expiring_soon'
      ).length,
      occupied: sortedBuildingUnits.filter(
        (unit) => unit.status === 'occupied' || unit.status === 'expiring_soon'
      ).length,
      problematic: sortedBuildingUnits.filter(
        (unit) => unit.status === 'problematic'
      ).length,
    }),
    [sortedBuildingUnits]
  )

  return (
    <div className="space-y-4">
      <section className="flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] border border-[#E3EAF3] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(20,41,82,0.05)]">
          <Search size={20} className="shrink-0 text-[#8C9AB3]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar apartamento..."
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#142952] outline-none placeholder:text-[#8C9AB3]"
          />
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex h-[50px] w-[88px] shrink-0 items-center justify-center gap-2 rounded-[18px] border border-[#E3EAF3] bg-white text-sm font-semibold text-[#5E6E8C] shadow-[0_8px_22px_rgba(20,41,82,0.05)]"
        >
          <SlidersHorizontal size={18} />
          Filtros
        </button>
      </section>

      <section className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-2 pr-4">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onUnitFilterChange(filter.id)}
              className={`inline-flex h-10 items-center gap-2 rounded-[16px] border px-4 text-sm font-semibold transition ${
                unitFilter === filter.id
                  ? 'border-[#4666D9] bg-[#4666D9] text-white shadow-[0_10px_20px_rgba(70,102,217,0.18)]'
                  : 'border-[#E3EAF3] bg-white text-[#5E6E8C]'
              }`}
            >
              {filter.id === 'expiring_soon' ? (
                <CalendarClock size={15} />
              ) : filter.id === 'problematic' ? (
                <AlertTriangle size={15} />
              ) : null}
              {filter.shortLabel}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                  unitFilter === filter.id
                    ? 'bg-white/18 text-white'
                    : 'bg-[#EEF4FF] text-[#4666D9]'
                }`}
              >
                {filterCounts[filter.id]}
              </span>
              <span className="sr-only">{filter.label}</span>
            </button>
          ))}
        </div>
      </section>

      {hasStructuredUnits ? (
        <section className="space-y-3">
          {filteredBuildingUnits.length > 0 ? (
            filteredBuildingUnits.map((unit) => (
              <BuildingUnitCard
                key={unit.id}
                buildingId={buildingId}
                search={search}
                unit={unit}
                onEdit={onEditUnit}
              />
            ))
          ) : (
            <UnitsEmptyState
              title="No encontramos apartamentos"
              description="Prueba otro filtro o cambia la busqueda."
            />
          )}
        </section>
      ) : (
        <LegacyUnitsFallback
          buildingId={buildingId}
          filteredUnits={filteredUnits}
          search={search}
          sortedApartments={sortedApartments}
          sortedCommonAreas={sortedCommonAreas}
        />
      )}

      <UnitFiltersSheet
        filterCounts={filterCounts}
        open={filtersOpen}
        selectedFilter={unitFilter}
        onClose={() => setFiltersOpen(false)}
        onSelect={(filter) => {
          onUnitFilterChange(filter)
          setFiltersOpen(false)
        }}
      />
    </div>
  )
}

function UnitFiltersSheet({
  filterCounts,
  open,
  selectedFilter,
  onClose,
  onSelect,
}: {
  filterCounts: Record<BuildingUnitFilter, number>
  open: boolean
  selectedFilter: BuildingUnitFilter
  onClose: () => void
  onSelect: (filter: BuildingUnitFilter) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#142952]/35 px-3 py-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(20,41,82,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C9AB3]">
              Filtros
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#142952]">
              Ver unidades
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#F3F6FB] text-[#6E7F9D]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter.id

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onSelect(filter.id)}
                className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-4 text-left transition ${
                  active
                    ? 'border-[#4666D9] bg-[#EEF4FF] text-[#4666D9]'
                    : 'border-[#E3EAF3] bg-white text-[#142952]'
                }`}
              >
                <span>
                  <span className="block text-base font-bold">
                    {filter.label}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[#7B8BA8]">
                    {getFilterDescription(filter.id, filterCounts[filter.id])}
                  </span>
                </span>
                {active ? <Check size={20} /> : null}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onSelect('all')}
          className="mt-4 h-12 w-full rounded-2xl bg-[#F3F6FB] text-sm font-bold text-[#4666D9]"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )
}

function getFilterDescription(filter: BuildingUnitFilter, count: number) {
  const descriptions: Record<BuildingUnitFilter, string> = {
    all: `${count} apartamentos registrados.`,
    available: `${count} apartamentos libres o disponibles para alquilar.`,
    expiring_soon: `${count} contratos marcados como proximos a vencer.`,
    occupied: `${count} apartamentos actualmente ocupados.`,
    problematic: `${count} unidades marcadas con problemas o alertas.`,
  }

  return descriptions[filter]
}

export function BuildingSummaryStrip({ summary }: { summary: BuildingUnitsSummary }) {
  return (
    <section className="rounded-[18px] border border-[#E3EAF3] bg-white px-3 py-4 shadow-[0_8px_22px_rgba(20,41,82,0.05)]">
      <div className="grid grid-cols-4 divide-x divide-[#E3EAF3]">
        <SummaryItem
          icon={<Building2 size={20} />}
          label="Aptos."
          tone="text-[#4666D9]"
          value={summary.totalApartments}
        />
        <SummaryItem
          icon={<Users size={20} />}
          label="Ocup."
          tone="text-[#249A57]"
          value={summary.occupied}
        />
        <SummaryItem
          icon={<KeyRound size={20} />}
          label="Disp."
          tone="text-[#E18A1D]"
          value={summary.available}
        />
        <SummaryItem
          icon={<Car size={20} />}
          label="Garajes"
          tone="text-[#8A55CC]"
          value={summary.garages}
        />
      </div>
    </section>
  )
}

function SummaryItem({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode
  label: string
  tone: string
  value: number
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 text-center">
      <span className={tone}>{icon}</span>
      <span className="text-[22px] font-bold leading-none text-[#142952]">
        {value}
      </span>
      <span className="text-[11px] font-medium leading-3 text-[#7B8BA8]">
        {label}
      </span>
    </div>
  )
}

function BuildingUnitCard({
  buildingId,
  onEdit,
  search,
  unit,
}: {
  buildingId: string
  onEdit: (unit: BuildingUnit) => void
  search: string
  unit: BuildingUnit
}) {
  const unitDetails = formatUnitDetails(unit)
  const contractText = formatContractText(unit)
  const leaseWarning = getLeaseWarning(unit)
  const status = getStatusPresentation(
    leaseWarning && unit.status === 'occupied' ? 'expiring_soon' : unit.status
  )

  return (
    <div className="rounded-[22px] border border-[#E3EAF3] bg-white p-4 shadow-[0_8px_22px_rgba(20,41,82,0.05)]">
      <div className="flex gap-4">
        <div
          className={`relative flex h-[112px] w-[48px] shrink-0 items-center justify-center rounded-[16px] ${status.sideClass}`}
        >
          <span
            className={`absolute left-3 top-3 h-2 w-2 rounded-full ${status.dotClass}`}
          />
          <Building2 className={status.iconClass} size={25} />
        </div>

        <Link
          href={buildUnitsHref({
            buildingId,
            group: 'apartments',
            search,
            unitKey: unit.unit_key,
          })}
          className="min-w-0 flex-1"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[26px] font-bold leading-none text-[#142952]">
                {unit.unit_label.replace(/^Apto\s+/i, '')}
              </h2>
              <p className="mt-3 text-[14px] font-medium text-[#5E6E8C]">
                {unitDetails || 'Sin detalles'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${status.badgeClass}`}
              >
                {status.label}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#E3EAF3] bg-white text-[#6E7F9D] shadow-[0_6px_14px_rgba(20,41,82,0.06)]">
                <MoreHorizontal size={20} />
              </span>
            </div>
          </div>

          {unit.status === 'available' ? (
            <div className="mt-3 space-y-1 text-sm font-medium text-[#6E7F9D]">
              <p>{formatAvailableText(unit)}</p>
              {unit.tenant_name ? <p>Ultimo inquilino: {unit.tenant_name}</p> : null}
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm font-medium text-[#142952]">
              {unit.tenant_name ? (
                <p className="flex items-center gap-2">
                  <User size={15} className="text-[#142952]" />
                  <span className="font-bold">{unit.tenant_name}</span>
                </p>
              ) : null}
              {unit.tenant_phone ? (
                <p className="flex items-center gap-2 text-[#6E7F9D]">
                  <Phone size={15} />
                  {unit.tenant_phone}
                </p>
              ) : null}
              {unit.tenant_email ? (
                <p className="flex items-center gap-2 truncate text-[#6E7F9D]">
                  <Mail size={15} />
                  {unit.tenant_email}
                </p>
              ) : null}
              {contractText ? (
                <p className="flex items-center gap-2 text-[#5E6E8C]">
                  <Phone size={15} className="rotate-90" />
                  {contractText}
                </p>
              ) : null}
              {leaseWarning ? (
                <p className={`flex items-center gap-2 text-sm font-bold ${leaseWarning.className}`}>
                  <Clock3 size={15} />
                  {leaseWarning.label}
                </p>
              ) : null}
            </div>
          )}
        </Link>
      </div>

      <button
        type="button"
        onClick={() => onEdit(unit)}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-[#EEF4FF] text-sm font-bold text-[#4666D9]"
      >
        <Pencil size={16} />
        Editar unidad
      </button>
    </div>
  )
}

function LegacyUnitsFallback({
  buildingId,
  filteredUnits,
  search,
  sortedApartments,
  sortedCommonAreas,
}: {
  buildingId: string
  filteredUnits: UnitCardSummary[]
  search: string
  sortedApartments: UnitCardSummary[]
  sortedCommonAreas: UnitCardSummary[]
}) {
  const legacyUnits = search.trim()
    ? filteredUnits
    : [...sortedApartments, ...sortedCommonAreas]

  if (legacyUnits.length === 0) {
    return (
      <UnitsEmptyState
        title="Aún no hay unidades"
        description="Agrega apartamentos o importa desde Excel para construir el resumen del edificio."
      />
    )
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[22px] border border-[#F3DFB8] bg-[#FFF9ED] px-4 py-3 text-sm font-medium leading-6 text-[#9B6A19]">
        Estos datos vienen del historial anterior. Cuando agregues apartamentos
        reales, esta pantalla mostrará ocupación, contratos, garajes y storage.
      </div>

      {legacyUnits.map((unit) => (
        <Link
          key={unit.unitKey}
          href={buildUnitsHref({
            buildingId,
            group: 'apartments',
            search,
            unitKey: unit.unitKey,
          })}
          className="block rounded-[22px] border border-[#E3EAF3] bg-white p-4 shadow-[0_8px_22px_rgba(20,41,82,0.05)]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-[#EEF4FF] text-[#4666D9]">
              <Building2 size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[22px] font-bold text-[#142952]">
                {unit.unitLabel}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#7B8BA8]">
                {unit.totalEvents} registros en historial
              </p>
            </div>
            <Warehouse size={18} className="text-[#8C9AB3]" />
          </div>
        </Link>
      ))}
    </section>
  )
}

function UnitsEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="rounded-[26px] border border-[#E3EAF3] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <h2 className="text-xl font-semibold text-[#142952]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#6E7F9D]">{description}</p>
    </section>
  )
}

function formatUnitDetails(unit: BuildingUnit) {
  const parts = [
    unit.bedrooms,
    unit.bathrooms
      ? `${formatDecimal(unit.bathrooms)} bano${unit.bathrooms === 1 ? '' : 's'}`
      : '',
    unit.size_sqft ? `${unit.size_sqft.toLocaleString('en-CA')} ft2` : '',
  ]

  return parts.filter(Boolean).join(' - ')
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toString()
}

function formatDate(value?: string | null) {
  if (!value) return ''

  return new Intl.DateTimeFormat('es-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function formatContractText(unit: BuildingUnit) {
  if (!unit.lease_start && !unit.lease_end) return ''
  if (unit.lease_start && unit.lease_end) {
    return `${formatDate(unit.lease_start)} - ${formatDate(unit.lease_end)}`
  }
  if (unit.lease_end) return `Vence ${formatDate(unit.lease_end)}`
  return `Inicio ${formatDate(unit.lease_start)}`
}

function formatAvailableText(unit: BuildingUnit) {
  if (!unit.available_since) return 'Disponible'

  return `Disponible desde ${formatDate(unit.available_since)}`
}

function getLeaseWarning(unit: BuildingUnit) {
  if (!unit.lease_end) return null

  const today = new Date()
  const leaseEnd = new Date(`${unit.lease_end}T12:00:00`)
  const days = Math.ceil(
    (leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (days < 0) {
    return {
      className: 'text-[#D64545]',
      label: `Vencido hace ${Math.abs(days)} dias`,
    }
  }

  if (days <= 120) {
    const months = Math.max(1, Math.ceil(days / 30))

    return {
      className: months <= 2 ? 'text-[#D64545]' : 'text-[#D97706]',
      label: `Vence en ${months} mes${months === 1 ? '' : 'es'}`,
    }
  }

  return null
}

function getStatusPresentation(status: BuildingUnit['status']) {
  const styles = {
    available: {
      badgeClass: 'bg-[#EEF4FF] text-[#3461C9]',
      dotClass: 'bg-[#4666D9]',
      iconClass: 'text-[#4666D9]',
      label: 'Disponible',
      sideClass: 'bg-[#EEF4FF]',
    },
    expiring_soon: {
      badgeClass: 'bg-[#FFF0F0] text-[#C53030]',
      dotClass: 'bg-[#D64545]',
      iconClass: 'text-[#D64545]',
      label: 'Proximo a vencer',
      sideClass: 'bg-[#FFF0F0]',
    },
    inactive: {
      badgeClass: 'bg-[#F2F5FA] text-[#7B8BA8]',
      dotClass: 'bg-[#8C9AB3]',
      iconClass: 'text-[#8C9AB3]',
      label: 'Inactivo',
      sideClass: 'bg-[#F2F5FA]',
    },
    occupied: {
      badgeClass: 'bg-[#EAF8EF] text-[#1D7D45]',
      dotClass: 'bg-[#249A57]',
      iconClass: 'text-[#249A57]',
      label: 'Ocupado',
      sideClass: 'bg-[#EAF8EF]',
    },
    problematic: {
      badgeClass: 'bg-[#FFF0F0] text-[#C53030]',
      dotClass: 'bg-[#D64545]',
      iconClass: 'text-[#D64545]',
      label: 'Problematico',
      sideClass: 'bg-[#FFF0F0]',
    },
  }

  return styles[status]
}
