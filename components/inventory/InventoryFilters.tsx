'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  LayoutGrid,
  MapPin,
  Package,
  Rows3,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react'
import type {
  ConditionFilter,
  ViewMode,
} from '@/hooks/useInventoryFiltersState'
import StyledDropdown from '@/components/ui/StyledDropdown'

type InventoryFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter?: string
  onCategoryFilterChange?: (value: string) => void
  availableCategories?: string[]
  conditionFilter?: ConditionFilter
  onConditionFilterChange?: (value: ConditionFilter) => void
  locationFilter?: string
  onLocationFilterChange?: (value: string) => void
  availableLocations?: string[]
  onlyLowStock: boolean
  onToggleOnlyLowStock: () => void
  totalLowStock: number
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export default function InventoryFilters({
  search,
  onSearchChange,
  categoryFilter = 'all',
  onCategoryFilterChange,
  availableCategories = [],
  conditionFilter = 'all',
  onConditionFilterChange,
  locationFilter = 'all',
  onLocationFilterChange,
  availableLocations = [],
  onlyLowStock,
  onToggleOnlyLowStock,
  totalLowStock,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
}: InventoryFiltersProps) {
  const t = useTranslations('inventoryFilters')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const categoryOptions = [
    { value: 'all', label: t('categories.all') },
    ...availableCategories.map((category) => ({
      value: category,
      label: category,
    })),
  ]

  const conditionOptions = [
    { value: 'all', label: t('conditions.all') },
    { value: 'new', label: t('conditions.new') },
    { value: 'used', label: t('conditions.used') },
    { value: 'damaged', label: t('conditions.damaged') },
  ]

  const locationOptions = [
    { value: 'all', label: t('locations.all') },
    ...availableLocations.map((location) => ({
      value: location,
      label: location,
    })),
  ]

  const totalActiveFilters = [
    categoryFilter !== 'all',
    conditionFilter !== 'all',
    locationFilter !== 'all',
    onlyLowStock,
  ].filter(Boolean).length

  useEffect(() => {
    if (!filtersOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [filtersOpen])

  return (
    <div className="relative overflow-visible rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-11 flex-1 items-center gap-3 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-3.5">
            <Search size={18} className="shrink-0 text-[#8C9AB3]" />

            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-[15px] text-[#142952] outline-none placeholder:text-[#8C9AB3]"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${
              filtersOpen || hasActiveFilters
                ? 'border-[#CFE0FA] bg-[#EEF4FF] text-[#2F66C8]'
                : 'border-[#E7EDF5] bg-white text-[#5E6E8C]'
            }`}
            aria-label={t('filters')}
          >
            <SlidersHorizontal className="h-5 w-5" />

            {totalActiveFilters > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E24B4B] px-1 text-[11px] font-bold text-white">
                {totalActiveFilters}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onToggleOnlyLowStock}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-[13px] font-semibold transition ${
              onlyLowStock
                ? 'border-[#F3C4C4] bg-[#FFF1F1] text-[#C93A3A]'
                : 'border-[#E7EDF5] bg-white text-[#5E6E8C]'
            }`}
          >
            <TriangleAlert className="h-4 w-4" />
            <span>{totalLowStock}</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#8C9AB3]">
            {hasActiveFilters ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2F66C8]" />
                <span>{t('activeFilters', { count: totalActiveFilters })}</span>
              </>
            ) : (
              <span>{t('noActiveFilters')}</span>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-[#E7EDF5] bg-white p-1">
            <ViewToggleButton
              icon={<LayoutGrid className="h-4 w-4" />}
              active={viewMode === 'grouped'}
              onClick={() => onViewModeChange('grouped')}
              ariaLabel={t('view.grouped')}
            />

            <ViewToggleButton
              icon={<Rows3 className="h-4 w-4" />}
              active={viewMode === 'list'}
              onClick={() => onViewModeChange('list')}
              ariaLabel={t('view.list')}
            />
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[#142952]/16 px-4 pb-6 pt-24 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_18px_50px_rgba(20,41,82,0.16)]">
            <div className="flex items-center justify-between border-b border-[#EEF2F8] px-4 py-4">
              <div>
                <p className="text-[15px] font-bold text-[#142952]">
                  {t('filters')}
                </p>
                <p className="text-xs text-[#8C9AB3]">
                  {t('filtersDescription')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E7EDF5] text-[#5E6E8C]"
                aria-label={t('closeFilters')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-3">
                <FilterBlock
                  icon={<Package className="h-4 w-4" />}
                  label="Categoria"
                >
                  <StyledDropdown
                    ariaLabel="Categoria"
                    value={categoryFilter}
                    options={categoryOptions}
                    onChange={(value) => onCategoryFilterChange?.(value)}
                    buttonClassName="rounded-[18px] py-3 text-[15px] shadow-none"
                  />
                </FilterBlock>

                <FilterBlock
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Estado"
                >
                  <StyledDropdown
                    ariaLabel="Estado"
                    value={conditionFilter}
                    options={conditionOptions}
                    onChange={(value) =>
                      onConditionFilterChange?.(value as ConditionFilter)
                    }
                    buttonClassName="rounded-[18px] py-3 text-[15px] shadow-none"
                  />
                </FilterBlock>

                <FilterBlock
                  icon={<MapPin className="h-4 w-4" />}
                  label="Ubicacion"
                >
                  <StyledDropdown
                    ariaLabel="Ubicacion"
                    value={locationFilter}
                    options={locationOptions}
                    onChange={(value) => onLocationFilterChange?.(value)}
                    buttonClassName="rounded-[18px] py-3 text-[15px] shadow-none"
                  />
                </FilterBlock>

                <button
                  type="button"
                  onClick={onToggleOnlyLowStock}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition ${
                    onlyLowStock
                      ? 'border-[#F3C4C4] bg-[#FFF1F1] text-[#C93A3A]'
                      : 'border-[#E7EDF5] bg-[#F9FBFE] text-[#5E6E8C]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <TriangleAlert className="h-4 w-4" />
                    {t('lowStock', { count: totalLowStock })}
                  </span>

                  <span
                    className={`h-5 w-5 rounded-full border ${
                      onlyLowStock
                        ? 'border-[#C93A3A] bg-[#C93A3A]'
                        : 'border-[#CCD6E5] bg-white'
                    }`}
                  />
                </button>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClearFilters()
                      setFiltersOpen(false)
                    }}
                    className="w-full rounded-[18px] border border-[#E7EDF5] bg-white px-4 py-3 text-sm font-semibold text-[#5E6E8C]"
                  >
                    {t('clearFilters')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FilterBlock({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-[#E7EDF5] bg-[#F9FBFE] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#8C9AB3]">
        {icon}
        {label}
      </div>

      {children}
    </div>
  )
}

function ViewToggleButton({
  icon,
  ariaLabel,
  active,
  onClick,
}: {
  icon: ReactNode
  ariaLabel: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-[15px] font-medium transition ${
        active
          ? 'bg-[#EEF4FF] text-[#2F66C8]'
          : 'text-[#5E6E8C] hover:bg-[#F8FAFE]'
      }`}
    >
      {icon}
    </button>
  )
}
