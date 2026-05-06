'use client'

import { useLocale, useTranslations } from 'next-intl'
import { History } from 'lucide-react'
import type { InventoryHistory } from '@/lib/inventory/inventoryTypes'
import {
  formatHistoryLine,
  getInventoryHistoryContextLabel,
  getInventoryHistoryNoteLabel,
  getInventoryHistorySummaryLabel,
  translateActionType,
} from '@/lib/inventory/inventoryUi'

type InventoryItemHistoryProps = {
  history: InventoryHistory[]
  unitOfMeasure?: string | null
}

export default function InventoryItemHistory({
  history,
  unitOfMeasure,
}: InventoryItemHistoryProps) {
  const t = useTranslations('inventoryItemRow')
  const tGlobal = useTranslations()
  const locale = useLocale()

  return (
    <div className="mt-5">
      <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#142952]">
        <History />
        {t('history')}
      </p>

      {history.length > 0 ? (
        history.slice(0, 4).map((entry) => (
          <div key={entry.id} className="rounded-2xl bg-[#F9FBFE] px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getMovementChipClass(
                  entry.movement_type,
                  entry.action_type
                )}`}
              >
                {translateActionType(
                  entry.action_type,
                  tGlobal,
                  entry.movement_type
                )}
              </span>
            </div>
            {getInventoryHistorySummaryLabel(entry, tGlobal) ? (
              <p className="mb-1 text-[15px] font-medium text-[#142952]">
                {getInventoryHistorySummaryLabel(entry, tGlobal, unitOfMeasure)}
              </p>
            ) : null}
            <p className="text-[13px] text-[#7B8BA8]">
              {formatHistoryLine(entry, locale)}
            </p>
            {getInventoryHistoryContextLabel(entry, tGlobal) ? (
              <p className="text-[13px] text-[#7B8BA8]">
                {getInventoryHistoryContextLabel(entry, tGlobal)}
              </p>
            ) : null}
            {entry.note ? (
              <p className="text-[15px] text-[#5E6E8C]">
                <span className="font-medium text-[#43506C]">
                  {safeReasonLabel(tGlobal)}
                </span>{' '}
                {getInventoryHistoryNoteLabel(entry.note, tGlobal)}
              </p>
            ) : null}
          </div>
        ))
      ) : (
        <div className="rounded-2xl bg-[#F9FBFE] px-4 py-3 text-[15px] text-[#5E6E8C]">
          {t('noHistory')}
        </div>
      )}
    </div>
  )
}

function safeReasonLabel(t: ReturnType<typeof useTranslations>) {
  try {
    return t('inventory.history.reasonLabel')
  } catch {
    return 'Motivo:'
  }
}

function getMovementChipClass(
  movementType: InventoryHistory['movement_type'],
  actionType: InventoryHistory['action_type']
) {
  const movement = movementType || actionType

  if (movement === 'created' || movement === 'entry') {
    return 'bg-[#EAF7F0] text-[#177B52]'
  }

  if (movement === 'installed' || movement === 'exit') {
    return 'bg-[#FFF4E8] text-[#B7791F]'
  }

  if (movement === 'updated' || movement === 'edited') {
    return 'bg-[#EEF4FF] text-[#2F66C8]'
  }

  return 'bg-[#F1F3F8] text-[#5E6E8C]'
}
