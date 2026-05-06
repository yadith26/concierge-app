import type {
  InventoryActionType,
  InventoryCondition,
  InventoryHistory,
} from '@/lib/inventory/inventoryTypes'

type TranslateFn = (key: string, values?: Record<string, unknown>) => string

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

export function translateActionType(
  action: InventoryActionType,
  t: TranslateFn
) {
  if (action === 'created') return t('inventoryHistoryAction.created')
  if (action === 'edited') return t('inventoryHistoryAction.edited')
  return t('inventoryHistoryAction.stockAdjustment')
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

  return `${date} • ${before} → ${after} (${change >= 0 ? '+' : ''}${change})`
}

export function getInventoryLocationLabel(
  location: string | null | undefined,
  t: TranslateFn
) {
  return location?.trim() || t('flatInventoryRow.noLocation')
}

export function getInventoryCategoryLabel(
  category: string | null | undefined,
  t: TranslateFn
) {
  return category?.trim() || t('tasksFilterBar.allCategories')
}

export function getInventoryNotesLabel(
  notes: string | null | undefined,
  t: TranslateFn
) {
  return notes?.trim() || t('taskCardExpanded.noNote')
}

export function isLowStockItem(
  quantity: number | null | undefined,
  minimumStock: number | null | undefined
) {
  const safeQuantity = Number(quantity ?? 0)
  const safeMinimumStock = Number(minimumStock ?? 0)

  return safeQuantity <= safeMinimumStock
}