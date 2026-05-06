'use client'

import { MapPin, Package2 } from 'lucide-react'
import { getConditionMeta, getInventoryLocationLabel } from '@/lib/inventory/inventoryUi'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import type { InventoryCategoryGroup } from '@/lib/inventory/inventoryHelpers'
import ManagerRecordsEmptyState from '@/components/manager/records/ManagerRecordsEmptyState'

type TFunction = (
  key: string,
  values?: Record<string, string | number | Date>
) => string

type ManagerRecordsInventoryContentProps = {
  viewMode: 'grouped' | 'list'
  groupedCategories: InventoryCategoryGroup[]
  filteredInventory: InventoryItem[]
  t: TFunction
}

export default function ManagerRecordsInventoryContent({
  viewMode,
  groupedCategories,
  filteredInventory,
  t,
}: ManagerRecordsInventoryContentProps) {
  if (viewMode === 'grouped') {
    return groupedCategories.length > 0 ? (
      <div className="space-y-3">
        {groupedCategories.map((group) => (
          <article
            key={group.category}
            className="rounded-[26px] border border-[#E7EDF5] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-sm font-semibold text-[#2F66C8]">
                  {group.totalItems} {group.totalItems === 1 ? 'item' : 'items'}
                </span>

                <h3 className="mt-4 text-[20px] font-bold tracking-tight text-[#142952]">
                  {group.category}
                </h3>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#7B8BA8]">
                  <span className="inline-flex items-center gap-2">
                    <Package2 size={16} />
                    {group.totalUnits} total
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} />
                    {group.locationSummary}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <ManagerRecordsEmptyState
        title="No inventory"
        description="No inventory items match the current filters."
      />
    )
  }

  return filteredInventory.length > 0 ? (
    <div className="space-y-3">
      {filteredInventory.map((item) => {
        const condition = getConditionMeta(item.condition, t)

        return (
          <article
            key={item.id}
            className="rounded-[26px] border border-[#E7EDF5] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[19px] font-semibold text-[#142952]">
                  {item.name}
                </p>
                <p className="mt-1 text-sm text-[#6E7F9D]">
                  {item.category?.trim() || 'Uncategorized'}
                </p>
              </div>

              <div className="rounded-[18px] bg-[#EEF4FF] px-3 py-2 text-sm font-semibold text-[#2F66C8]">
                {item.quantity}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${condition.chip}`}
              >
                {condition.label}
              </span>
              <span className="rounded-full bg-[#F3F6FB] px-3 py-1.5 text-xs font-medium text-[#60739A]">
                {getInventoryLocationLabel(item.location, 'No location')}
              </span>
            </div>

            {item.notes?.trim() ? (
              <p className="mt-4 text-sm leading-6 text-[#5E6E8C]">
                {item.notes}
              </p>
            ) : null}
          </article>
        )
      })}
    </div>
  ) : (
    <ManagerRecordsEmptyState
      title="No inventory"
      description="No inventory items match the current filters."
    />
  )
}
