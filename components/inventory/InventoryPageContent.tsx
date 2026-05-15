'use client'

import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import InventoryFilters from '@/components/inventory/InventoryFilters'
import InventoryList from '@/components/inventory/InventoryList'
import type {
  ConditionFilter,
  ViewMode,
} from '@/hooks/useInventoryFiltersState'
import type { InventoryCategoryGroup } from '@/lib/inventory/inventoryHelpers'
import type {
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'

type InventoryPageContentProps = {
  scrollRef: (node: HTMLElement | null) => void
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  availableCategories: string[]
  conditionFilter: ConditionFilter
  onConditionFilterChange: (value: ConditionFilter) => void
  locationFilter: string
  onLocationFilterChange: (value: string) => void
  availableLocations: string[]
  onlyLowStock: boolean
  onToggleOnlyLowStock: () => void
  totalLowStock: number
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  groupedCategories: InventoryCategoryGroup[]
  filteredItems: InventoryItem[]
  expandedCategory: string | null
  expandedItemId: string | null
  onSetExpandedCategory: React.Dispatch<React.SetStateAction<string | null>>
  onSetExpandedItemId: React.Dispatch<React.SetStateAction<string | null>>
  onOpenCreateModal: (
    category?: string,
    location?: string,
    initialValues?: { item_type?: string; unit_of_measure?: string }
  ) => void
  onOpenEditModal: (item: InventoryItem) => void
  onQuickAdjustStock: (item: InventoryItem, change: number) => void
  history: InventoryHistory[]
  onExport: () => void
}

export default function InventoryPageContent({
  scrollRef,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  availableCategories,
  conditionFilter,
  onConditionFilterChange,
  locationFilter,
  onLocationFilterChange,
  availableLocations,
  onlyLowStock,
  onToggleOnlyLowStock,
  totalLowStock,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  groupedCategories,
  filteredItems,
  expandedCategory,
  expandedItemId,
  onSetExpandedCategory,
  onSetExpandedItemId,
  onOpenCreateModal,
  onOpenEditModal,
  onQuickAdjustStock,
  history,
  onExport,
}: InventoryPageContentProps) {
  const pageT = useTranslations('inventoryPage')

  return (
    <section
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-40 pt-3"
    >
      <div className="space-y-4">
        <div>
          <button
            onClick={onExport}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#DCE7F5] bg-white px-4 py-3 text-sm font-semibold text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.06)] hover:bg-[#F8FAFE]"
            type="button"
          >
            <Download size={18} />
            {pageT('export')}
          </button>
        </div>

        <InventoryFilters
          search={search}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          availableCategories={availableCategories}
          conditionFilter={conditionFilter}
          onConditionFilterChange={onConditionFilterChange}
          locationFilter={locationFilter}
          onLocationFilterChange={onLocationFilterChange}
          availableLocations={availableLocations}
          onlyLowStock={onlyLowStock}
          onToggleOnlyLowStock={onToggleOnlyLowStock}
          totalLowStock={totalLowStock}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
        />

        <InventoryList
          viewMode={viewMode}
          groupedCategories={groupedCategories}
          filteredItems={filteredItems}
          expandedCategory={expandedCategory}
          expandedItemId={expandedItemId}
          onSetExpandedCategory={onSetExpandedCategory}
          onSetExpandedItemId={onSetExpandedItemId}
          onOpenCreateModal={onOpenCreateModal}
          onOpenEditModal={onOpenEditModal}
          onQuickAdjustStock={onQuickAdjustStock}
          history={history}
        />
      </div>
    </section>
  )
}
