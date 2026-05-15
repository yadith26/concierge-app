'use client'

import { PackagePlus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  formatInventoryQuantityWithUnit,
  getInventoryLocationLabel,
} from '@/lib/inventory/inventoryUi'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'

type InventoryConfirmExistingItemModalProps = {
  open: boolean
  item: InventoryItem | null
  quantity: number
  unitOfMeasure?: string | null
  context: 'manual' | 'delivery'
  saving?: boolean
  message?: string
  onClose: () => void
  onConfirm: () => void
}

export default function InventoryConfirmExistingItemModal({
  open,
  item,
  quantity,
  unitOfMeasure,
  context,
  saving = false,
  message,
  onClose,
  onConfirm,
}: InventoryConfirmExistingItemModalProps) {
  const t = useTranslations('inventoryConfirmModal')
  const tGlobal = useTranslations()

  if (!open || !item) return null

  const quantityLabel = formatInventoryQuantityWithUnit(
    quantity,
    unitOfMeasure || item.unit_of_measure,
    tGlobal
  )

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-end sm:items-center">
        <div className="w-full rounded-t-[32px] bg-white px-5 pb-6 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:rounded-[32px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C9AB3]">
                {t('eyebrow')}
              </p>
              <h2 className="mt-2 text-[22px] font-bold text-[#142952]">
                {t('title')}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#E2E8F0] p-3 text-[#6E7F9D] hover:bg-[#F8FAFE]"
              aria-label={t('close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#D8E6FF] bg-[#F4F8FF] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F1FF] text-[#2F66C8]">
                <PackagePlus size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#142952]">
                  {item.name}
                </p>
                <p className="mt-1 text-sm leading-7 text-[#5E6E8C]">
                  {context === 'delivery'
                    ? t('deliveryDescription', { quantity: quantityLabel })
                    : t('manualDescription', { quantity: quantityLabel })}
                </p>
                <p className="mt-2 text-sm text-[#7B8BA8]">
                  {t('locationLabel', {
                    location: getInventoryLocationLabel(
                      item.location,
                      tGlobal('flatInventoryRow.noLocation')
                    ),
                  })}
                </p>
              </div>
            </div>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[22px] border border-[#DCE7F5] px-4 py-4 text-sm font-semibold text-[#6E7F9D] hover:bg-[#F8FAFE]"
            >
              {t('cancel')}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onConfirm}
              className="flex-1 rounded-[22px] bg-[#2F66C8] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.25)] hover:bg-[#2859B2] disabled:opacity-60"
            >
              {saving ? t('confirming') : t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
