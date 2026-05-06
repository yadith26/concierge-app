import type { SaveInventoryPayload } from '@/lib/inventory/inventoryMutations'
import { inferInventoryCategoryFromName } from '@/lib/inventory/inventorySmartParser'
import type { Task } from '@/lib/tasks/taskTypes'

const REFRIGERATOR_PATTERN = /refrigerador|nevera|fridge|refrigerator/i
const STOVE_PATTERN = /cocina|estufa|stove|range|oven/i
const AIR_CONDITIONER_PATTERN = /aire acondicionado|air conditioner/i

export function buildInventoryPrefillFromTask(task: Task): SaveInventoryPayload {
  const combinedText = [task.title, task.description || '']
    .join(' ')
    .trim()

  const inferredItemName = inferItemName(combinedText, task.title)
  const inferredCategory = inferInventoryCategoryFromName(combinedText)
  const cleanedTitle = task.title.trim()
  const cleanedDescription = task.description?.trim() || ''
  const cleanedLocation = task.apartment_or_area?.trim() || ''
  const notes = [cleanedDescription, cleanedLocation ? `Relacionado con ${cleanedLocation}` : '']
    .filter(Boolean)
    .join(' | ')

  return {
    name: cleanedTitle || inferredItemName,
    category: inferredCategory,
    item_type: inferredItemName,
    quantity: 1,
    minimum_stock: 0,
    location: '',
    condition: 'new',
    notes,
  }
}

function inferItemName(text: string, fallbackTitle: string) {
  if (REFRIGERATOR_PATTERN.test(text)) {
    return 'Refrigerador'
  }

  if (STOVE_PATTERN.test(text)) {
    return 'Estufa'
  }

  if (AIR_CONDITIONER_PATTERN.test(text)) {
    return 'Aire acondicionado'
  }

  return fallbackTitle.trim() || 'Nuevo item'
}
