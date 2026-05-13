'use client'

import { useTranslations } from 'next-intl'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import { formatInventoryQuantityWithUnit } from '@/lib/inventory/inventoryUi'

type InventoryVariantSelectorModalProps = {
  open: boolean
  category: string
  groupLabel: string
  variants: InventoryItem[]
  onAddOne: (item: InventoryItem) => void
  onOpenCreate: (
    category?: string,
    location?: string,
    initialValues?: { item_type?: string; unit_of_measure?: string }
  ) => void
  onClose: () => void
}

export default function InventoryVariantSelectorModal({
  open,
  category,
  groupLabel,
  variants,
  onAddOne,
  onOpenCreate,
  onClose,
}: InventoryVariantSelectorModalProps) {
  const tGlobal = useTranslations()
  const t = useTranslations('inventoryVariantSelectorModal')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 px-4 py-6 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full max-w-md items-end sm:items-center">
        <div className="w-full rounded-[28px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.20)]">
          <div className="mb-4">
            <h3 className="text-[19px] font-bold text-[#142952]">{groupLabel}</h3>
            <p className="mt-1 text-[15px] text-[#6E7F9D]">
              {t('description')}
            </p>
          </div>

          <div className="space-y-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  onAddOne(variant)
                  onClose()
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-[#FBFDFF] px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#142952]">
                    {variant.name}
                  </p>
                  <p className="mt-1 text-[13px] text-[#7B8BA8]">
                    {formatInventoryQuantityWithUnit(
                      variant.quantity,
                      variant.unit_of_measure
                    )} {t('availableNow')}
                  </p>
                </div>

                <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold text-[#2F66C8]">
                  {t('increase')}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenCreate(category, '', {
                item_type: groupLabel,
                unit_of_measure: selectedGroupUnit(variants),
              })
              onClose()
            }}
            className="mt-4 w-full rounded-2xl bg-[#2F66C8] px-4 py-4 text-[15px] font-semibold text-white"
          >
            {t('createNewVariant')}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-2xl border border-[#E3EAF3] px-4 py-4 text-[15px] font-semibold text-[#5E6E8C]"
          >
            {tGlobal('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

function selectedGroupUnit(variants: InventoryItem[]) {
  return variants[0]?.unit_of_measure || 'unidad'
}
