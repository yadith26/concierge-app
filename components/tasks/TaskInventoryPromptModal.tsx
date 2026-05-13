'use client'

import { useTranslations } from 'next-intl'

type TaskInventoryPromptModalProps = {
  open: boolean
  taskTitle: string
  taskCategory?: string
  message?: string
  onClose: () => void
  onSkip: () => void
  onAddToInventory: () => void
  onUseExistingItem?: () => void
}

export default function TaskInventoryPromptModal({
  open,
  taskTitle,
  taskCategory,
  message,
  onClose,
  onSkip,
  onAddToInventory,
  onUseExistingItem,
}: TaskInventoryPromptModalProps) {
  const t = useTranslations('taskInventoryPromptModal')

  if (!open) return null

  const isReplacement = taskCategory === 'change'
  const isDelivery = taskCategory === 'delivery'
  const isStandardInventoryUse =
    taskCategory === 'repair' ||
    taskCategory === 'paint' ||
    taskCategory === 'cleaning' ||
    taskCategory === 'other'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-end sm:items-center">
        <div className="w-full rounded-t-[32px] bg-white px-5 pb-6 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:rounded-[32px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C9AB3]">
                {t('eyebrow')}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#142952]">
                {isStandardInventoryUse
                  ? t('usedInventoryTitle')
                  : t('updateInventoryTitle')}
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
            {isReplacement
              ? t.rich('replacementDescription', {
                  taskTitle: () => (
                    <span className="font-semibold text-[#142952]">{taskTitle}</span>
                  ),
                })
              : isDelivery
                ? t.rich('deliveryDescription', {
                    taskTitle: () => (
                      <span className="font-semibold text-[#142952]">{taskTitle}</span>
                    ),
                  })
                : isStandardInventoryUse
                  ? t.rich('usageDescription', {
                      taskTitle: () => (
                        <span className="font-semibold text-[#142952]">{taskTitle}</span>
                      ),
                    })
                  : t.rich('genericDescription', {
                      taskTitle: () => (
                        <span className="font-semibold text-[#142952]">{taskTitle}</span>
                      ),
                    })}
          </p>

          {message ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          <div
            className={`mt-6 grid grid-cols-1 gap-3 ${
              isReplacement ? '' : 'sm:grid-cols-2'
            }`}
          >
            <button
              type="button"
              onClick={onSkip}
              className="rounded-[24px] border border-[#D9E0EA] px-4 py-4 text-sm font-semibold text-[#5E6E8C] hover:bg-[#F8FAFE]"
            >
              {t('completeWithoutInventory')}
            </button>

            {isReplacement && onUseExistingItem ? (
              <button
                type="button"
                onClick={onUseExistingItem}
                className="rounded-[24px] border border-[#D9E0EA] bg-white px-4 py-4 text-sm font-semibold text-[#2F66C8] hover:bg-[#F8FAFE]"
              >
                {t('useExistingItem')}
              </button>
            ) : null}

            {isStandardInventoryUse && onUseExistingItem ? (
              <button
                type="button"
                onClick={onUseExistingItem}
                className="rounded-[24px] border border-[#D9E0EA] bg-white px-4 py-4 text-sm font-semibold text-[#2F66C8] hover:bg-[#F8FAFE]"
              >
                {t('consumeExistingItem')}
              </button>
            ) : null}

            {!isStandardInventoryUse ? (
              <button
                type="button"
                onClick={onAddToInventory}
                className="rounded-[24px] bg-[#2F66C8] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.25)] hover:bg-[#2859B2]"
              >
                {isReplacement
                  ? t('createNewItem')
                  : isDelivery
                    ? t('addToInventory')
                    : t('completeAndAdd')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
