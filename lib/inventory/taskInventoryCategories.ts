import type { TaskCategory } from '@/lib/tasks/taskTypes'

export const DELIVERY_INVENTORY_CATEGORIES = new Set<TaskCategory>(['delivery'])

export const CONSUME_INVENTORY_CATEGORIES = new Set<TaskCategory>([
  'change',
  'repair',
  'paint',
  'cleaning',
  'other',
])

export const INVENTORY_CANDIDATE_CATEGORIES = new Set<TaskCategory>([
  ...DELIVERY_INVENTORY_CATEGORIES,
  ...CONSUME_INVENTORY_CATEGORIES,
])

export function requiresInventoryFlow(category: TaskCategory) {
  return INVENTORY_CANDIDATE_CATEGORIES.has(category)
}

export function isDeliveryInventoryCategory(category: TaskCategory) {
  return DELIVERY_INVENTORY_CATEGORIES.has(category)
}

export function isConsumeInventoryCategory(category: TaskCategory) {
  return CONSUME_INVENTORY_CATEGORIES.has(category)
}
