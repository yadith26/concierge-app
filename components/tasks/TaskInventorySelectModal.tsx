'use client'

import { MapPin, Package, TriangleAlert } from 'lucide-react'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import type { InventoryMatchReason } from '@/lib/inventory/findMatchingInventoryItem'
import {
  getConditionMeta,
  getInventoryItemTypeLabel,
  getInventoryLocationLabel,
  isLowStockItem,
} from '@/lib/inventory/inventoryUi'
import { useTranslations } from 'next-intl'

type TaskInventorySelectModalProps = {
  open: boolean
  taskTitle: string
  taskCategory?: string
  itemLabel: string
  items: InventoryItem[]
  reasonMap?: Record<string, InventoryMatchReason[]>
  suggestedItemId?: string | null
  infoMessage?: string
  message?: string
  saving?: boolean
  onClose: () => void
  onCreateNew: () => void
  onSelectItem: (item: InventoryItem) => void
}

export default function TaskInventorySelectModal({
  open,
  taskTitle,
  taskCategory,
  itemLabel,
  items,
  reasonMap,
  suggestedItemId,
  infoMessage,
  message,
  saving = false,
  onClose,
  onCreateNew,
  onSelectItem,
}: TaskInventorySelectModalProps) {
  const tGlobal = useTranslations()
  const isDelivery = taskCategory === 'delivery'
  const isReplacement = taskCategory === 'change'
  const allowCreateNew = isDelivery || isReplacement

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-end sm:items-center">
        <div className="w-full rounded-t-[32px] bg-white px-5 pb-6 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:rounded-[32px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C9AB3]">
                Inventario
              </p>
              <h2 className="mt-2 text-[22px] font-bold text-[#142952]">
                {isDelivery
                  ? 'Escoge donde sumar stock'
                  : 'Escoge el item a descontar'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#6E7F9D] hover:bg-[#F8FAFE]"
            >
              Cerrar
            </button>
          </div>

          <p className="mt-4 text-[15px] leading-7 text-[#5E6E8C]">
            {isDelivery ? (
              <>
                Para completar <span className="font-semibold text-[#142952]">{taskTitle}</span>,
                elige a que item existente quieres sumar{' '}
                <span className="font-semibold text-[#142952]">1 unidad</span>.
              </>
            ) : (
              <>
                Para completar <span className="font-semibold text-[#142952]">{taskTitle}</span>,
                elige que {itemLabel ? ` ${itemLabel.toLowerCase()}` : ' item'} del inventario se
                usará. Descontaremos <span className="font-semibold text-[#142952]">1 unidad</span>.
              </>
            )}
          </p>

          {message ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          {infoMessage ? (
            <div className="mt-4 rounded-2xl border border-[#D8E6FF] bg-[#F4F8FF] px-4 py-3 text-sm text-[#2F66C8]">
              {infoMessage}
            </div>
          ) : null}

          <div className="mt-5 max-h-[44vh] space-y-3 overflow-y-auto pr-1">
            {items.length > 0 ? (
              items.map((item) => {
                const conditionMeta = getConditionMeta(item.condition, tGlobal)
                const isLowStock = isLowStockItem(item.quantity, item.minimum_stock)
                const itemTypeLabel = getInventoryItemTypeLabel(item)
                const reasons = getReasonLabels(reasonMap?.[item.id] || [])

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={saving}
                    onClick={() => onSelectItem(item)}
                    className="w-full rounded-[24px] border border-[#E7EDF5] bg-[#FBFDFF] px-4 py-4 text-left disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[15px] font-bold text-[#142952]">
                            {item.name}
                          </p>

                          {suggestedItemId === item.id ? (
                            <span className="inline-flex items-center rounded-full bg-[#E8F6ED] px-2.5 py-1 text-[11px] font-semibold text-[#2D8C57]">
                              Sugerido
                            </span>
                          ) : null}

                          {itemTypeLabel ? (
                            <span className="inline-flex items-center rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[11px] font-semibold text-[#2F66C8]">
                              {itemTypeLabel}
                            </span>
                          ) : null}

                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${conditionMeta.chip}`}
                          >
                            {conditionMeta.label}
                          </span>

                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4F5] px-2.5 py-1 text-[11px] font-semibold text-[#D64555]">
                              <TriangleAlert className="h-3.5 w-3.5" />
                              Stock bajo
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-[#7B8BA8]">
                          <span className="inline-flex items-center gap-1.5">
                            <Package className="h-4 w-4" />
                            {item.quantity} disponibles
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {getInventoryLocationLabel(
                              item.location,
                              tGlobal('flatInventoryRow.noLocation')
                            )}
                          </span>
                        </div>

                        {reasons.length > 0 ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {reasons.map((reason) => (
                              <span
                                key={`${item.id}-${reason}`}
                                className="inline-flex items-center rounded-full bg-[#FFF8E8] px-2.5 py-1 text-[11px] font-semibold text-[#B7791F]"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <span className="shrink-0 rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold text-[#2F66C8]">
                        {isDelivery ? 'Sumar' : 'Usar'}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl bg-[#F9FBFE] px-4 py-4 text-[15px] text-[#5E6E8C]">
                {isDelivery
                  ? 'No encontramos items parecidos en inventario para esta entrega.'
                  : isReplacement
                    ? 'No encontramos items compatibles en inventario para este reemplazo.'
                    : 'No encontramos items compatibles en inventario para esta tarea.'}
              </div>
            )}
          </div>

          {allowCreateNew ? (
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-4 w-full rounded-[24px] bg-[#2F66C8] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,102,200,0.25)] hover:bg-[#2859B2]"
            >
              {isDelivery && items.length > 0
                ? 'Crear item nuevo de todas formas'
                : 'Crear item nuevo'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function getReasonLabels(reasons: InventoryMatchReason[]) {
  const labels = new Set<string>()

  if (
    reasons.includes('exact_name') ||
    reasons.includes('contains_name') ||
    reasons.includes('preferred_name') ||
    reasons.includes('preferred_partial_name')
  ) {
    labels.add('Coincide por nombre')
  }

  if (
    reasons.includes('exact_item_type') ||
    reasons.includes('contains_item_type') ||
    reasons.includes('preferred_item_type')
  ) {
    labels.add('Coincide por item')
  }

  if (reasons.includes('same_category')) {
    labels.add('Misma categoria')
  }

  if (reasons.includes('exact_variant') || reasons.includes('contains_variant')) {
    labels.add('Coincide por variante')
  }

  if (reasons.includes('shared_tokens')) {
    labels.add('Palabras parecidas')
  }

  return Array.from(labels).slice(0, 2)
}
