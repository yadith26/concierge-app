'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import InventoryCategoryCard from '@/components/inventory/InventoryCategoryCard'
import type {
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import type { InventoryCategoryGroup } from '@/lib/inventory/inventoryHelpers'
import type { ViewMode } from '@/hooks/useInventoryFiltersState'
import FlatInventoryRow from '@/components/inventory/FlatInventoryRow'

type InventoryListProps = {
  viewMode: ViewMode
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
}

export default function InventoryList({
  viewMode,
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
}: InventoryListProps) {
  const t = useTranslations('inventoryList')

  const historyByItemId = useMemo(() => {
    return history.reduce<Record<string, InventoryHistory[]>>((acc, entry) => {
      if (!acc[entry.item_id]) {
        acc[entry.item_id] = []
      }

      acc[entry.item_id].push(entry)
      return acc
    }, {})
  }, [history])

  if (viewMode === 'grouped') {
    if (groupedCategories.length === 0) {
      return <EmptyState text={t('noResults')} />
    }

    return (
      <>
        {groupedCategories.map((group) => (
          <InventoryCategoryCard
            key={group.category}
            category={group.category}
            items={group.items}
            totalUnits={group.totalUnits}
            totalItems={group.totalItems}
            locationSummary={group.locationSummary}
            expanded={expandedCategory === group.category}
            expandedItemId={expandedItemId}
            historyByItemId={historyByItemId}
            onToggleCategory={() => {
              onSetExpandedCategory((prev) =>
                prev === group.category ? null : group.category
              )
              onSetExpandedItemId(null)
            }}
            onOpenCreate={onOpenCreateModal}
            onToggleItem={(itemId) =>
              onSetExpandedItemId((prev) => (prev === itemId ? null : itemId))
            }
            onEditItem={onOpenEditModal}
            onAddOne={(item) => onQuickAdjustStock(item, 1)}
            onRemoveOne={(item) => onQuickAdjustStock(item, -1)}
          />
        ))}
      </>
    )
  }

  if (filteredItems.length === 0) {
    return <EmptyState text={t('noResults')} />
  }

  return (
    <div className="space-y-3">
      {filteredItems.map((item) => (
        <FlatInventoryRow
          key={item.id}
          item={item}
          expanded={expandedItemId === item.id}
          onToggle={() =>
            onSetExpandedItemId((prev) => (prev === item.id ? null : item.id))
          }
          onEdit={() => onOpenEditModal(item)}
          onAddOne={() => onQuickAdjustStock(item, 1)}
          onRemoveOne={() => onQuickAdjustStock(item, -1)}
          history={historyByItemId[item.id] || []}
        />
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-6 py-10 text-center text-[#7B8BA8]">{text}</div>
    </div>
  )
}
