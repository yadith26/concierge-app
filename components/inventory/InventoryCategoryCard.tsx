'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Plus,
} from 'lucide-react'
import InventoryItemRow from './InventoryItemRow'
import InventoryVariantSelectorModal from './InventoryVariantSelectorModal'
import type {
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import {
  formatInventoryQuantity,
  formatInventoryQuantityWithUnit,
  getInventoryItemTypeLabel,
  getInventoryLocationLabel,
} from '@/lib/inventory/inventoryUi'

type InventoryCategoryCardProps = {
  category: string
  items: InventoryItem[]
  totalUnits: number
  totalItems: number
  locationSummary: string
  expanded: boolean
  expandedItemId: string | null
  historyByItemId: Record<string, InventoryHistory[]>
  onToggleCategory: () => void
  onOpenCreate: (
    category?: string,
    location?: string,
    initialValues?: { item_type?: string; unit_of_measure?: string }
  ) => void
  onToggleItem: (itemId: string) => void
  onEditItem: (item: InventoryItem) => void
  onAddOne: (item: InventoryItem) => void
  onRemoveOne: (item: InventoryItem) => void
}

type InventoryTypeGroup = {
  key: string
  label: string
  totalUnits: number
  variants: InventoryItem[]
  locationSummary: string
}

export default function InventoryCategoryCard({
  category,
  items,
  totalUnits,
  totalItems,
  locationSummary,
  expanded,
  expandedItemId,
  historyByItemId,
  onToggleCategory,
  onOpenCreate,
  onToggleItem,
  onEditItem,
  onAddOne,
  onRemoveOne,
}: InventoryCategoryCardProps) {
  const t = useTranslations('inventoryCategoryCard')
  const tGlobal = useTranslations()
  const [expandedTypeKey, setExpandedTypeKey] = useState<string | null>(null)
  const [selectorGroupKey, setSelectorGroupKey] = useState<string | null>(null)

  const typeGroups = useMemo<InventoryTypeGroup[]>(() => {
    const groups = new Map<string, InventoryTypeGroup>()

    items.forEach((item) => {
      const label = getInventoryItemTypeLabel(item, item.name)
      const key = label.toLowerCase()
      const existing = groups.get(key)

      if (existing) {
        existing.totalUnits += Number(item.quantity || 0)
        existing.variants.push(item)
        return
      }

      groups.set(key, {
        key,
        label,
        totalUnits: Number(item.quantity || 0),
        variants: [item],
        locationSummary: getInventoryLocationLabel(
          item.location,
          tGlobal('flatInventoryRow.noLocation')
        ),
      })
    })

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        variants: [...group.variants].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [items, tGlobal])

  const visibleExpandedTypeKey = expanded ? expandedTypeKey : null
  const selectedGroup =
    typeGroups.find((group) => group.key === selectorGroupKey) || null

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <button
          type="button"
          onClick={onToggleCategory}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold text-[#2F66C8]">
              {t('itemsCount', { count: totalItems })}
            </span>
          </div>

          <h2 className="mt-2 text-[20px] font-bold tracking-tight text-[#142952]">
            {category}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[15px] text-[#7B8BA8]">
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              {formatInventoryQuantity(totalUnits)} en total
            </span>

            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {locationSummary}
            </span>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenCreate(category)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8]"
            aria-label={t('addItemToCategory')}
          >
            <Plus size={22} />
          </button>

          <button
            type="button"
            onClick={onToggleCategory}
            className="rounded-2xl border border-[#E3EAF3] bg-white p-3 text-[#6E7F9D] shadow-[0_4px_12px_rgba(20,41,82,0.05)]"
            aria-label={expanded ? t('collapseCategory') : t('expandCategory')}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded ? (
        <div>
          <div className="border-t border-[#EEF3F8] px-4 pb-4 pt-3">
            {typeGroups.length > 0 ? (
              <div className="space-y-3">
                {typeGroups.map((group) => {
                  const groupExpanded = visibleExpandedTypeKey === group.key

                  return (
                    <div
                      key={group.key}
                      className="overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-[#FBFDFF]"
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTypeKey((prev) =>
                              prev === group.key ? null : group.key
                            )
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-[17px] font-bold text-[#142952]">
                              {group.label}
                            </h3>

                            <span className="inline-flex items-center rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold text-[#2F66C8]">
                              {formatInventoryQuantityWithUnit(
                                group.totalUnits,
                                group.variants[0]?.unit_of_measure || 'unidad'
                              )}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[15px] text-[#7B8BA8]">
                            <span>
                              {group.variants.length}{' '}
                              {group.variants.length === 1
                                ? 'variante'
                                : 'variantes'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {group.locationSummary}
                            </span>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectorGroupKey(group.key)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE7F5] bg-white text-[#2F66C8]"
                            aria-label={t('addItemToCategory')}
                          >
                            <Plus size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTypeKey((prev) =>
                                prev === group.key ? null : group.key
                              )
                            }
                            className="rounded-2xl border border-[#E3EAF3] bg-white p-3 text-[#6E7F9D]"
                            aria-label={
                              groupExpanded
                                ? t('collapseCategory')
                                : t('expandCategory')
                            }
                          >
                            {groupExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {groupExpanded ? (
                        <div>
                          <div className="border-t border-[#EEF3F8] px-3 pb-3 pt-3">
                            <div className="space-y-3">
                              {group.variants.map((item) => (
                                <InventoryItemRow
                                  key={item.id}
                                  item={item}
                                  expanded={expandedItemId === item.id}
                                  onToggle={() => onToggleItem(item.id)}
                                  onEdit={() => onEditItem(item)}
                                  onAddOne={() => onAddOne(item)}
                                  onRemoveOne={() => onRemoveOne(item)}
                                  history={historyByItemId[item.id] || []}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#F9FBFE] px-4 py-4 text-sm text-[#7B8BA8]">
                {t('emptyCategory')}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <InventoryVariantSelectorModal
        open={!!selectedGroup}
        category={category}
        groupLabel={selectedGroup?.label || ''}
        variants={selectedGroup?.variants || []}
        onAddOne={onAddOne}
        onOpenCreate={onOpenCreate}
        onClose={() => setSelectorGroupKey(null)}
      />
    </div>
  )
}
