import { supabase } from '@/lib/supabase'
import type {
  InventoryActionType,
  InventoryMovementType,
  InventorySourceType,
} from '@/lib/inventory/inventoryTypes'

type InsertInventoryHistoryParams = {
  itemId: string
  actionType: InventoryActionType
  movementType?: InventoryMovementType | null
  sourceType?: InventorySourceType | null
  sourceId?: string | null
  sourceLabel?: string | null
  unitLabel?: string | null
  quantityBefore: number | null
  quantityChange: number | null
  quantityAfter: number | null
  note?: string | null
  createdBy: string | null
}

function isMissingStructuredColumnError(error: {
  message?: string
  details?: string
  hint?: string
  code?: string
} | null) {
  const text = [
    error?.message || '',
    error?.details || '',
    error?.hint || '',
  ]
    .join(' ')
    .toLowerCase()

  return (
    text.includes('movement_type') ||
    text.includes('source_type') ||
    text.includes('source_id') ||
    text.includes('source_label') ||
    text.includes('unit_label') ||
    text.includes('column')
  )
}

export async function insertInventoryHistoryEntry({
  itemId,
  actionType,
  movementType = null,
  sourceType = null,
  sourceId = null,
  sourceLabel = null,
  unitLabel = null,
  quantityBefore,
  quantityChange,
  quantityAfter,
  note = null,
  createdBy,
}: InsertInventoryHistoryParams) {
  const structuredPayload = {
    item_id: itemId,
    action_type: actionType,
    movement_type: movementType,
    source_type: sourceType,
    source_id: sourceId,
    source_label: sourceLabel,
    unit_label: unitLabel,
    quantity_before: quantityBefore,
    quantity_change: quantityChange,
    quantity_after: quantityAfter,
    note,
    created_by: createdBy,
  }

  const { error } = await supabase
    .from('inventory_history')
    .insert(structuredPayload)

  if (!error) return

  if (!isMissingStructuredColumnError(error)) {
    throw error
  }

  const legacyPayload = {
    item_id: itemId,
    action_type: actionType,
    quantity_before: quantityBefore,
    quantity_change: quantityChange,
    quantity_after: quantityAfter,
    note,
    created_by: createdBy,
  }

  const { error: legacyError } = await supabase
    .from('inventory_history')
    .insert(legacyPayload)

  if (legacyError) {
    throw legacyError
  }
}
