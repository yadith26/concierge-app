'use client'

import { useTranslations } from 'next-intl'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import { getInventoryUnitLabel } from '@/lib/inventory/inventoryUi'

type TaskInventoryUsageModalProps = {
  open: boolean
  item: InventoryItem | null
  taskTitle: string
  quantity: string
  location: string
  isMaterial: boolean
  saving?: boolean
  message?: string
  onClose: () => void
  onChangeQuantity: (value: string) => void
  onChangeLocation: (value: string) => void
  onConfirm: () => void
}

export default function TaskInventoryUsageModal({
  open,
  item,
  taskTitle,
  quantity,
  location,
  isMaterial,
  saving = false,
  message,
  onClose,
  onChangeQuantity,
  onChangeLocation,
  onConfirm,
}: TaskInventoryUsageModalProps) {
  const t = useTranslations('taskInventoryUsageModal')

  if (!open || !item) return null

  const measurementUnitLabel = getInventoryUnitLabel(item.unit_of_measure, 2)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
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
              className="rounded-2xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#6E7F9D] hover:bg-[#F8FAFE]"
            >
              {t('close')}
            </button>
          </div>

          <p className="mt-4 text-[15px] leading-7 text-[#5E6E8C]">
            {t.rich('description', {
              itemName: () => (
                <span className="font-semibold text-[#142952]">{item.name}</span>
              ),
              taskTitle: () => (
                <span className="font-semibold text-[#142952]"> {taskTitle}</span>
              ),
            })}
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
                {t('quantityLabel', { unit: measurementUnitLabel })}
              </label>
              <input
                type="number"
                min="0"
                step={isMaterial ? '0.01' : '1'}
                value={quantity}
                onChange={(e) => onChangeQuantity(e.target.value)}
                disabled={saving || !isMaterial}
                className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none placeholder:text-[#8C9AB3] disabled:bg-[#F8FAFE] disabled:text-[#6E7F9D]"
              />
              <p className="mt-2 text-xs text-[#7B8BA8]">
                {isMaterial ? t('materialHint') : t('unitHint')}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
                {t('locationLabel')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => onChangeLocation(e.target.value)}
                placeholder={t('locationPlaceholder')}
                disabled={saving}
                className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none placeholder:text-[#8C9AB3]"
              />
            </div>

            {message ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="mt-5 w-full rounded-[24px] bg-[#2F66C8] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.25)] hover:bg-[#2859B2] disabled:opacity-60"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
