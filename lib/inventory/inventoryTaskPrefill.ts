import type { InventoryCondition } from '@/lib/inventory/inventoryTypes'
import type { Task } from '@/lib/tasks/taskTypes'

export type InventoryCreateDraft = {
  name: string
  category: string
  quantity: number
  minimum_stock: number
  location: string
  condition: InventoryCondition
  notes: string
}

function normalizeText(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function inferInventoryName(task: Task) {
  const text = normalizeText(`${task.title} ${task.description || ''}`)

  if (
    text.includes('refrigerador') ||
    text.includes('nevera') ||
    text.includes('fridge') ||
    text.includes('refrigerator')
  ) {
    return 'Refrigerador'
  }

  if (
    text.includes('cocina') ||
    text.includes('estufa') ||
    text.includes('stove') ||
    text.includes('range') ||
    text.includes('oven')
  ) {
    return 'Cocina / Fogon'
  }

  if (text.includes('pintura') || text.includes('paint')) {
    return 'Pintura'
  }

  if (text.includes('cemento') || text.includes('cement')) {
    return 'Cemento'
  }

  return task.title.trim() || 'Nuevo item'
}

export function isInventoryCandidateTask(task: Task) {
  return task.category === 'change' || task.category === 'delivery'
}

export function buildInventoryDraftFromTask(task: Task): InventoryCreateDraft {
  const inferredName = inferInventoryName(task)
  const location = ''
  const notesParts = [
    task.description?.trim() || '',
    task.apartment_or_area?.trim()
      ? `Relacionado con: ${task.apartment_or_area.trim()}`
      : '',
    `Agregado desde tarea completada: ${task.title}`,
  ].filter(Boolean)

  return {
    name: inferredName,
    category: inferredName,
    quantity: 1,
    minimum_stock: 0,
    location,
    condition: 'new',
    notes: notesParts.join(' | '),
  }
}
