'use client'

import { useTranslations } from 'next-intl'
import {
  Image as ImageIcon,
  MapPin,
  Minus,
  Pencil,
  Plus,
  TriangleAlert,
} from 'lucide-react'
import InventoryItemDetails from './InventoryItemDetails'
import type {
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import {
  formatInventoryQuantityWithUnit,
  getConditionMeta,
  getInventoryItemTypeLabel,
  getInventoryLocationLabel,
  isLowStockItem,
} from '@/lib/inventory/inventoryUi'

type InventoryItemRowProps = {
  item: InventoryItem
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onAddOne: () => void
  onRemoveOne: () => void
  history: InventoryHistory[]
}

export default function InventoryItemRow({
  item,
  expanded,
  onToggle,
  onEdit,
  onAddOne,
  onRemoveOne,
  history,
}: InventoryItemRowProps) {
  const t = useTranslations('inventoryItemRow')
  const tGlobal = useTranslations()

  const conditionMeta = getConditionMeta(item.condition, tGlobal)
  const isLowStock = isLowStockItem(item.quantity, item.minimum_stock)
  const itemTypeLabel = getInventoryItemTypeLabel(item)

  return (
    <div
      onClick={onToggle}
      className={`overflow-hidden rounded-[24px] border bg-white shadow-[0_6px_18px_rgba(20,41,82,0.05)] ${
        isLowStock ? 'border-[#F5C9CE]' : 'border-[#E7EDF5]'
      } cursor-pointer`}
    >
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-tight text-[#142952]">
              {item.name}
            </h3>

            {itemTypeLabel ? (
              <span className="inline-flex items-center rounded-full bg-[#F4F6FA] px-2.5 py-1 text-[11px] font-semibold text-[#5E6E8C]">
                {itemTypeLabel}
              </span>
            ) : null}

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${conditionMeta.chip}`}
            >
              {conditionMeta.label}
            </span>

            {isLowStock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4F5] px-2.5 py-1 text-[11px] font-semibold text-[#D64555]">
                <TriangleAlert className="h-3.5 w-3.5" />
                {t('lowStock')}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-[#7B8BA8]">
            <MapPin className="h-4 w-4" />
            <span>
              {getInventoryLocationLabel(
                item.location,
                tGlobal('flatInventoryRow.noLocation')
              )}
            </span>

            {(item.inventory_item_photos?.length || 0) > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                {item.inventory_item_photos?.length}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onRemoveOne()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border"
          >
            <Minus size={18} />
          </button>

          <div className="min-w-[96px] text-center text-[14px] font-bold leading-tight text-[#142952] sm:text-right">
            {formatInventoryQuantityWithUnit(item.quantity, item.unit_of_measure)}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onAddOne()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border"
          >
            <Plus size={18} />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onEdit()
              }}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <InventoryItemDetails item={item} history={history} />
        </div>
      </div>
    </div>
  )
}
