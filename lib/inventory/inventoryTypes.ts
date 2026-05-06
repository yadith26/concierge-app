export type InventoryCondition = 'new' | 'used' | 'damaged'
export type InventoryActionType = 'created' | 'edited' | 'stock_adjustment'
export type InventoryMovementType =
  | 'created'
  | 'updated'
  | 'entry'
  | 'exit'
  | 'installed'
  | 'manual_adjustment'
export type InventorySourceType = 'task' | 'manual' | 'manager' | 'system'

export type ExistingInventoryPhoto = {
  id?: string
  image_url: string
}

export type InventoryItem = {
  id: string
  building_id: string
  name: string
  category: string | null
  item_type?: string | null
  unit_of_measure?: string | null
  quantity: number
  minimum_stock: number
  location: string | null
  condition: InventoryCondition
  notes: string | null
  created_by: string | null
  inventory_item_photos?: ExistingInventoryPhoto[]
  created_at: string
  updated_at: string
}

export type InventoryHistory = {
  id: string
  item_id: string
  action_type: InventoryActionType
  movement_type?: InventoryMovementType | null
  source_type?: InventorySourceType | null
  source_id?: string | null
  source_label?: string | null
  unit_label?: string | null
  quantity_before: number | null
  quantity_change: number | null
  quantity_after: number | null
  note: string | null
  created_by: string | null
  created_at: string
}

export type EditableInventoryItem = {
  id: string
  name: string
  category: string
  item_type?: string
  unit_of_measure?: string
  quantity: string
  minimum_stock: string
  location: string
  condition: InventoryCondition
  notes: string
  inventory_item_photos?: ExistingInventoryPhoto[]
}
