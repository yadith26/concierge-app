import type { TranslationValues } from 'next-intl'
import type {
  InventoryActionType,
  InventoryCondition,
  InventoryHistory,
  InventoryMovementType,
} from '@/lib/inventory/inventoryTypes'

type TranslateFn = (key: string, values?: TranslationValues) => string

function safeTranslate(
  t: TranslateFn,
  key: string,
  fallback: string,
  values?: TranslationValues
) {
  const maybeHas = (t as TranslateFn & { has?: (key: string) => boolean }).has
  if (typeof maybeHas === 'function' && !maybeHas(key)) {
    return fallback
  }

  try {
    return t(key, values)
  } catch {
    return fallback
  }
}

export function getConditionMeta(
  condition: InventoryCondition,
  t: TranslateFn
) {
  if (condition === 'new') {
    return {
      label: t('inventoryFormModal.conditions.new'),
      chip: 'bg-[#EAF7F0] text-[#177B52]',
    }
  }

  if (condition === 'used') {
    return {
      label: t('inventoryFormModal.conditions.used'),
      chip: 'bg-[#EEF4FF] text-[#60739A]',
    }
  }

  return {
    label: t('inventoryFormModal.conditions.damaged'),
    chip: 'bg-[#FFF4F5] text-[#D64555]',
  }
}

export function translateCondition(
  condition: InventoryCondition,
  t: TranslateFn
) {
  if (condition === 'new') return t('inventoryFormModal.conditions.new')
  if (condition === 'used') return t('inventoryFormModal.conditions.used')
  return t('inventoryFormModal.conditions.damaged')
}

export function translateMovementType(
  movement: InventoryMovementType | null | undefined,
  t: TranslateFn
) {
  if (movement === 'created') {
    return safeTranslate(t, 'inventoryHistoryAction.created', 'Item created')
  }
  if (movement === 'updated') {
    return safeTranslate(t, 'inventoryHistoryAction.updated', 'Item updated')
  }
  if (movement === 'entry') {
    return safeTranslate(t, 'inventoryHistoryAction.entry', 'Stock entry')
  }
  if (movement === 'exit') {
    return safeTranslate(t, 'inventoryHistoryAction.exit', 'Stock exit')
  }
  if (movement === 'installed') {
    return safeTranslate(t, 'inventoryHistoryAction.installed', 'Installed')
  }
  if (movement === 'manual_adjustment') {
    return safeTranslate(
      t,
      'inventoryHistoryAction.manualAdjustment',
      'Manual adjustment'
    )
  }
  return ''
}

export function translateActionType(
  action: InventoryActionType,
  t: TranslateFn,
  movement?: InventoryMovementType | null
) {
  const movementLabel = translateMovementType(movement, t)
  if (movementLabel) return movementLabel
  if (action === 'created') {
    return safeTranslate(t, 'inventoryHistoryAction.created', 'Item created')
  }
  if (action === 'edited') {
    return safeTranslate(t, 'inventoryHistoryAction.edited', 'Item edited')
  }
  return safeTranslate(
    t,
    'inventoryHistoryAction.stockAdjustment',
    'Stock adjustment'
  )
}

export function formatHistoryLine(
  entry: InventoryHistory,
  locale: string = 'es-ES'
) {
  const date = new Date(entry.created_at).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const before = entry.quantity_before ?? 0
  const change = entry.quantity_change ?? 0
  const after = entry.quantity_after ?? 0

  return `${date} - ${before} -> ${after} (${change >= 0 ? '+' : ''}${change})`
}

export function getInventoryLocationLabel(
  location: string | null | undefined,
  fallbackLabel: string
) {
  return location?.trim() || fallbackLabel
}

export function getInventoryNotesLabel(
  notes: string | null | undefined,
  fallbackLabel: string
) {
  return notes?.trim() || fallbackLabel
}

export function getInventoryItemTypeLabel(
  item: { item_type?: string | null; name?: string | null },
  fallbackLabel?: string
) {
  return item.item_type?.trim() || fallbackLabel || item.name?.trim() || ''
}

export function formatInventoryQuantity(
  quantity: number | null | undefined,
  maximumFractionDigits: number = 2
) {
  const value = Number(quantity ?? 0)
  if (!Number.isFinite(value)) return '0'

  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits,
  }).format(value)
}

export function getInventoryUnitLabel(
  unitOfMeasure: string | null | undefined,
  quantity?: number | null
) {
  const unit = (unitOfMeasure || '').trim().toLowerCase()
  const safeQuantity = Number(quantity ?? 0)

  if (!unit || unit === 'unidad') {
    return Math.abs(safeQuantity) === 1 ? 'unidad' : 'unidades'
  }

  if (unit === 'galon') {
    return Math.abs(safeQuantity) === 1 ? 'galon' : 'galones'
  }

  if (unit === 'lata') {
    return Math.abs(safeQuantity) === 1 ? 'lata' : 'latas'
  }

  if (unit === 'saco') {
    return Math.abs(safeQuantity) === 1 ? 'saco' : 'sacos'
  }

  if (unit === 'caja') {
    return Math.abs(safeQuantity) === 1 ? 'caja' : 'cajas'
  }

  if (unit === 'bolsa') {
    return Math.abs(safeQuantity) === 1 ? 'bolsa' : 'bolsas'
  }

  if (unit === 'rollo') {
    return Math.abs(safeQuantity) === 1 ? 'rollo' : 'rollos'
  }

  if (unit === 'tubo') {
    return Math.abs(safeQuantity) === 1 ? 'tubo' : 'tubos'
  }

  if (unit === 'botella') {
    return Math.abs(safeQuantity) === 1 ? 'botella' : 'botellas'
  }

  return unit
}

export function formatInventoryQuantityWithUnit(
  quantity: number | null | undefined,
  unitOfMeasure: string | null | undefined
) {
  return `${formatInventoryQuantity(quantity)} ${getInventoryUnitLabel(
    unitOfMeasure,
    quantity
  )}`.trim()
}

export function getInventoryHistoryNoteLabel(
  note: string | null | undefined,
  t: TranslateFn
) {
  if (!note) return ''
  if (note === 'inventory.history.created') return t('inventory.history.created')
  if (note === 'inventory.history.updated') return t('inventory.history.updated')
  if (note === 'inventory.history.quickAdd') return 'Cantidad aumentada'
  if (note === 'inventory.history.quickRemove') {
    return 'Cantidad reducida'
  }

  return note
}

export function getInventoryHistoryContextLabel(
  entry: InventoryHistory,
  t: TranslateFn
) {
  const pieces: string[] = []

  if (entry.source_type === 'task' && entry.source_label?.trim()) {
    pieces.push(
      safeTranslate(
        t,
        'inventory.history.fromTask',
        `From task: ${entry.source_label.trim()}`,
        { task: entry.source_label.trim() }
      )
    )
  }

  if (entry.unit_label?.trim()) {
    pieces.push(
      safeTranslate(
        t,
        'inventory.history.unitLabel',
        `Unit: ${entry.unit_label.trim()}`,
        { unit: entry.unit_label.trim() }
      )
    )
  }

  return pieces.join(' | ')
}

export function getInventoryHistorySummaryLabel(
  entry: InventoryHistory,
  t: TranslateFn,
  unitOfMeasure?: string | null
) {
  const absoluteChange = Math.abs(Number(entry.quantity_change ?? 0))
  const quantityLabel = formatInventoryQuantityWithUnit(
    absoluteChange,
    unitOfMeasure
  )
  const taskLabel = entry.source_label?.trim() || ''
  const unitLabel = entry.unit_label?.trim() || ''

  if (entry.movement_type === 'installed') {
    return [
      safeTranslate(
        t,
        'inventory.history.summary.installed',
        `Instalado ${quantityLabel}`,
        { quantity: quantityLabel }
      ),
      unitLabel ? `en ${unitLabel}` : '',
      taskLabel ? `desde ${taskLabel}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (entry.movement_type === 'exit') {
    return [
      safeTranslate(
        t,
        'inventory.history.summary.used',
        `Usado ${quantityLabel}`,
        { quantity: quantityLabel }
      ),
      unitLabel ? `en ${unitLabel}` : '',
      taskLabel ? `para ${taskLabel}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (entry.movement_type === 'entry') {
    return [
      safeTranslate(
        t,
        'inventory.history.summary.entry',
        `Entrada de ${quantityLabel}`,
        { quantity: quantityLabel }
      ),
      taskLabel ? `desde ${taskLabel}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (entry.movement_type === 'manual_adjustment') {
    const signedQuantity = Number(entry.quantity_change ?? 0)
    const signedQuantityLabel = `${signedQuantity >= 0 ? '+' : ''}${formatInventoryQuantityWithUnit(
      Math.abs(signedQuantity),
      unitOfMeasure
    )}`
    return [
      safeTranslate(
        t,
        'inventory.history.summary.adjustment',
        `Ajuste manual ${signedQuantityLabel}`,
        {
          quantity: signedQuantityLabel,
        }
      ),
      unitLabel ? `en ${unitLabel}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (entry.movement_type === 'created') {
    return safeTranslate(
      t,
      'inventory.history.summary.created',
      `Creado con ${formatInventoryQuantityWithUnit(
        entry.quantity_after ?? 0,
        unitOfMeasure
      )}`,
      {
        quantity: formatInventoryQuantityWithUnit(
          entry.quantity_after ?? 0,
          unitOfMeasure
        ),
      }
    )
  }

  if (entry.movement_type === 'updated') {
    return safeTranslate(
      t,
      'inventory.history.summary.updated',
      'Item actualizado'
    )
  }

  return ''
}

export function isLowStockItem(
  quantity: number | null | undefined,
  minimumStock: number | null | undefined
) {
  return Number(quantity ?? 0) <= Number(minimumStock ?? 0)
}
