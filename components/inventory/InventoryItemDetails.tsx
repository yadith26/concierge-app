'use client'

import { useTranslations } from 'next-intl'
import {
  Check,
  Image as ImageIcon,
  MapPin,
  NotebookPen,
  Package,
  TriangleAlert,
} from 'lucide-react'
import InventoryDetailRow from './InventoryDetailRow'
import type {
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import {
  formatInventoryQuantityWithUnit,
  getInventoryItemTypeLabel,
  getInventoryLocationLabel,
  getInventoryNotesLabel,
  getInventoryUnitLabel,
  translateCondition,
} from '@/lib/inventory/inventoryUi'
import InventoryItemHistory from './InventoryItemHistory'

type InventoryItemDetailsProps = {
  item: InventoryItem
  history: InventoryHistory[]
}

export default function InventoryItemDetails({
  item,
  history,
}: InventoryItemDetailsProps) {
  const t = useTranslations('inventoryItemRow')
  const tGlobal = useTranslations()
  const itemTypeLabel = getInventoryItemTypeLabel(item)

  return (
    <div className="space-y-3 border-t px-4 py-4">
      <InventoryDetailRow
        icon={<Package />}
        label={t('fullTitle')}
        value={item.name?.trim() || tGlobal('taskCardExpanded.noNote')}
      />

      <InventoryDetailRow
        icon={<Package />}
        label={t('currentQuantity')}
        value={formatInventoryQuantityWithUnit(
          item.quantity,
          item.unit_of_measure
        )}
      />

      <InventoryDetailRow
        icon={<TriangleAlert />}
        label={t('minimumStock')}
        value={formatInventoryQuantityWithUnit(
          item.minimum_stock,
          item.unit_of_measure
        )}
      />

      <InventoryDetailRow
        icon={<Package />}
        label={tGlobal('inventoryFormModal.measurementUnit')}
        value={getInventoryUnitLabel(item.unit_of_measure, 2)}
      />

      <InventoryDetailRow
        icon={<MapPin />}
        label={t('location')}
        value={getInventoryLocationLabel(
          item.location,
          tGlobal('flatInventoryRow.noLocation')
        )}
      />

      <InventoryDetailRow
        icon={<Check />}
        label={t('condition')}
        value={translateCondition(item.condition, tGlobal)}
      />

      {itemTypeLabel ? (
        <InventoryDetailRow
          icon={<Package />}
          label={t('itemType')}
          value={itemTypeLabel}
        />
      ) : null}

      <InventoryDetailRow
        icon={<NotebookPen />}
        label={t('notes')}
        value={getInventoryNotesLabel(
          item.notes,
          tGlobal('taskCardExpanded.noNote')
        )}
      />

      {(item.inventory_item_photos?.length || 0) > 0 ? (
        <div>
          <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#142952]">
            <ImageIcon className="h-4 w-4" />
            {tGlobal('taskCardExpanded.photos')}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {item.inventory_item_photos?.map((photo, index) => (
              <a
                key={photo.id || `${photo.image_url}-${index}`}
                href={photo.image_url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white"
              >
                <img
                  src={photo.image_url}
                  alt={`${tGlobal('taskCardExpanded.photo')} ${index + 1}`}
                  className="h-24 w-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <InventoryItemHistory
        history={history}
        unitOfMeasure={item.unit_of_measure || 'unidad'}
      />
    </div>
  )
}
