'use client'

import { useTranslations } from 'next-intl'
import { Image as ImageIcon, MapPin, Minus, Package, Pencil, Plus, TriangleAlert } from 'lucide-react'
import InventoryItemDetails from './InventoryItemDetails'
import type { InventoryHistory, InventoryItem } from '@/lib/inventory/inventoryTypes'
import { formatInventoryQuantityWithUnit } from '@/lib/inventory/inventoryUi'

type FlatInventoryRowProps = {
  item: InventoryItem
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onAddOne: () => void
  onRemoveOne: () => void
  history: InventoryHistory[]
}

export default function FlatInventoryRow({
  item,
  expanded,
  onToggle,
  onEdit,
  onAddOne,
  onRemoveOne,
  history,
}: FlatInventoryRowProps) {
  const t = useTranslations('flatInventoryRow')
  const isLowStock = item.quantity <= item.minimum_stock

  return (
    <div
      onClick={onToggle}
      className={`overflow-hidden rounded-[24px] border bg-white shadow-[0_6px_18px_rgba(20,41,82,0.05)] ${
        isLowStock ? 'border-[#F5C9CE]' : 'border-[#E7EDF5]'
      } cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-tight text-[#142952]">
              {item.name}
            </h3>

            {item.item_type && (
              <span className="inline-flex items-center rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold text-[#2F66C8]">
                {item.item_type}
              </span>
            )}

            {item.category && (
              <span className="inline-flex items-center rounded-full bg-[#F4F6FA] px-2.5 py-1 text-[11px] font-semibold text-[#5E6E8C]">
                {item.category}
              </span>
            )}

            {isLowStock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4F5] px-2.5 py-1 text-[11px] font-semibold text-[#D64555]">
                <TriangleAlert className="h-3.5 w-3.5" />
                {t('lowStock')}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[15px] text-[#7B8BA8]">
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              {formatInventoryQuantityWithUnit(item.quantity, item.unit_of_measure)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {item.location || t('noLocation')}
            </span>

            {(item.inventory_item_photos?.length || 0) > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                {item.inventory_item_photos?.length}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onRemoveOne()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EE] bg-white text-[#6E7F9D]"
            aria-label={t('removeOne')}
          >
            <Minus size={18} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onAddOne()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE3EE] bg-white text-[#142952]"
            aria-label={t('addOne')}
          >
            <Plus size={18} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#142952]"
            aria-label={t('editItem')}
          >
            <Pencil size={18} />
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <InventoryItemDetails item={item} history={history} />
        </div>
      </div>
    </div>
  )
}
