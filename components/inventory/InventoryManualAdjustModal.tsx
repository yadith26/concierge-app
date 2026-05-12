'use client'

import { Loader2, MinusCircle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { isMaterialInventoryCategory } from '@/lib/inventory/inventoryCatalog'
import { getInventoryUnitLabel } from '@/lib/inventory/inventoryUi'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'

type InventoryManualAdjustModalProps = {
  open: boolean
  item: InventoryItem | null
  quantity: string
  reason: string
  saving: boolean
  errorMessage?: string
  onQuantityChange: (value: string) => void
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function InventoryManualAdjustModal({
  open,
  item,
  quantity,
  reason,
  saving,
  errorMessage,
  onQuantityChange,
  onReasonChange,
  onClose,
  onConfirm,
}: InventoryManualAdjustModalProps) {
  const t = useTranslations('inventoryManualAdjust')

  if (!open || !item) return null

  const isMaterial = isMaterialInventoryCategory(item.category)
  const measurementUnitLabel = getInventoryUnitLabel(item.unit_of_measure, 2)

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_20px_60px_rgba(20,41,82,0.2)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8A97B3]">
              {t('eyebrow')}
            </p>
            <h2 className="mt-2 text-[22px] font-semibold leading-tight text-[#142952]">
              {t('title')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E2E8F0] text-[#6E7F9D] hover:bg-[#F8FAFE]"
            aria-label={t('close')}
          >
            <X size={22} />
          </button>
        </div>

        <div className="mb-5 rounded-[24px] border border-[#F4D7A0] bg-[#FFF8EC] px-4 py-3 text-[#8C6114]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F3B13D] text-white">
              <MinusCircle size={20} />
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-6 text-[#8C6114]">
                {t('summaryTitle', { quantity, item: item.name })}
              </p>
              <p className="text-[14px] leading-6 text-[#9B7A33]">
                {t('summaryHint')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-[#142952]">
              {t('quantityLabel')} ({measurementUnitLabel})
            </span>
            <input
              type="number"
              min="0"
              step={isMaterial ? '0.01' : '1'}
              value={quantity}
              onChange={(event) => onQuantityChange(event.target.value)}
              className="w-full rounded-[22px] border border-[#DCE3EE] px-4 py-3 text-[16px] text-[#142952] outline-none transition focus:border-[#2F66C8] focus:ring-2 focus:ring-[#DCE7F9]"
            />
            <p className="mt-2 text-[13px] text-[#7B8BA8]">
              {isMaterial ? t('quantityHintMaterial') : t('quantityHintUnit')}
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-[#142952]">
              {t('reasonLabel')}
            </span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
              placeholder={t('reasonPlaceholder')}
              className="w-full rounded-[22px] border border-[#DCE3EE] px-4 py-3 text-[16px] text-[#142952] outline-none transition focus:border-[#2F66C8] focus:ring-2 focus:ring-[#DCE7F9]"
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-[18px] bg-[#FFF4F5] px-4 py-3 text-[14px] text-[#C24B5A]">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[22px] border border-[#DCE3EE] px-4 py-3 text-[16px] font-semibold text-[#60739A] hover:bg-[#F8FAFE]"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-[#2F66C8] px-4 py-3 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(47,102,200,0.22)] hover:bg-[#295AB4] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? t('saving') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
