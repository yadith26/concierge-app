import { supabase } from '@/lib/supabase'
import type { InventoryCondition } from '@/lib/inventory/inventoryTypes'
import type { Task } from '@/lib/tasks/taskTypes'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'

export type InventoryConditionSelection = InventoryCondition | ''
import {
  INVENTORY_CATEGORY_OPTIONS,
  normalizeMeasurementUnit,
  normalizeInventoryCategory,
} from '@/lib/inventory/inventoryCatalog'
import { insertInventoryHistoryEntry } from '@/lib/inventory/inventoryHistoryMutations'

export const DEFAULT_INVENTORY_CATEGORIES = [...INVENTORY_CATEGORY_OPTIONS]

export const DEFAULT_INVENTORY_LOCATIONS = [
  'Deposito',
  'Cuarto de mantenimiento',
  'Garage',
]

export type SaveInventoryPayload = {
  name: string
  category: string
  item_type?: string
  unit_of_measure?: string
  quantity: number
  minimum_stock: number
  location: string
  condition: InventoryConditionSelection
  notes: string
}

type CreateInventoryItemParams = {
  buildingId: string
  profileId: string
  payload: SaveInventoryPayload
}

const INSTALLED_MOVEMENT_CATEGORIES = new Set([
  'change',
  'repair',
  'paint',
  'cleaning',
])

function buildConsumeInventoryNote(task: Task, taskLocation: string) {
  const baseLabel =
    task.category === 'change'
      ? 'Usado para reemplazo'
      : task.category === 'repair'
        ? 'Usado para reparación'
        : task.category === 'paint'
          ? 'Usado para trabajo de pintura'
          : task.category === 'cleaning'
            ? 'Usado para limpieza'
            : 'Usado para tarea'

  return [baseLabel, task.title.trim(), taskLocation ? `en ${taskLocation}` : '']
    .filter(Boolean)
    .join(' | ')
}

export async function fetchInventoryFormOptions(buildingId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('name, category, location')
    .eq('building_id', buildingId)

  if (error) {
    throw new Error('No se pudieron cargar las opciones de inventario.')
  }

  return {
    categories: mergeUniqueValues(
      DEFAULT_INVENTORY_CATEGORIES,
      ((data as Array<{ category: string | null }> | null) || []).map(
        (item) => item.category || ''
      )
    ),
    names: mergeUniqueValues(
      [],
      ((data as Array<{ name: string | null }> | null) || []).map(
        (item) => item.name || ''
      )
    ),
    locations: mergeUniqueValues(
      DEFAULT_INVENTORY_LOCATIONS,
      ((data as Array<{ location: string | null }> | null) || []).map(
        (item) => item.location || ''
      )
    ),
  }
}

export async function fetchActiveInventoryItems(buildingId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('building_id', buildingId)
    .gt('quantity', 0)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error('No se pudo cargar el inventario disponible.')
  }

  return ((data as InventoryItem[] | null) || []).map((item) => ({
    ...item,
    category: normalizeInventoryCategory(item.category),
  }))
}

export async function createInventoryItem({
  buildingId,
  profileId,
  payload,
}: CreateInventoryItemParams) {
  const trimmedName = payload.name.trim()
  const trimmedCategory = normalizeInventoryCategory(payload.category)
  const trimmedUnitOfMeasure = normalizeMeasurementUnit(
    payload.unit_of_measure,
    payload.category
  )
  const trimmedLocation = payload.location.trim()
  const trimmedNotes = payload.notes.trim()

  if (!trimmedName) {
    throw new Error('El nombre es obligatorio.')
  }

  if (!trimmedCategory) {
    throw new Error('La categoria es obligatoria.')
  }

  if (!payload.condition) {
    throw new Error('El estado es obligatorio.')
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
    throw new Error('La cantidad no es valida.')
  }

  if (!Number.isFinite(payload.minimum_stock) || payload.minimum_stock < 0) {
    throw new Error('El stock minimo no es valido.')
  }

  const { data: insertedItem, error: insertError } = await supabase
    .from('inventory_items')
    .insert({
      building_id: buildingId,
      name: trimmedName,
      category: trimmedCategory,
      item_type: payload.item_type?.trim() || null,
      unit_of_measure: trimmedUnitOfMeasure,
      quantity: payload.quantity,
      minimum_stock: payload.minimum_stock,
      location: trimmedLocation || null,
      condition: payload.condition,
      notes: trimmedNotes || null,
      created_by: profileId,
    })
    .select('id, quantity')
    .single()

  if (insertError || !insertedItem) {
    const errorText = [
      insertError?.message,
      insertError?.details,
      insertError?.hint,
      insertError?.code,
    ]
      .filter(Boolean)
      .join(' | ')
      .toLowerCase()

    if (
      errorText.includes('unit_of_measure') &&
      (errorText.includes('column') || errorText.includes('schema cache'))
    ) {
      throw new Error(
        'Tu base de datos todavia no tiene la columna unit_of_measure. Corre el script inventory_measurement_units.sql para guardar unidades como galon, saco o lata.'
      )
    }

    throw new Error('No se pudo crear el item de inventario.')
  }

  try {
    await insertInventoryHistoryEntry({
      itemId: insertedItem.id,
      actionType: 'created',
      movementType: 'created',
      sourceType: 'manual',
      quantityBefore: 0,
      quantityChange: insertedItem.quantity,
      quantityAfter: insertedItem.quantity,
      note: 'inventory.history.created',
      createdBy: profileId,
    })
  } catch {
    throw new Error('El item se creo, pero no se pudo registrar el historial.')
  }

  return insertedItem
}

export async function consumeInventoryItemForTask({
  item,
  task,
  profileId,
  quantityUsed = 1,
  locationUsed,
}: {
  item: InventoryItem
  task: Task
  profileId: string
  quantityUsed?: number
  locationUsed?: string | null
}) {
  if (!item.id) {
    throw new Error('No encontramos el item de inventario.')
  }

  if (Number(item.quantity || 0) <= 0) {
    throw new Error('Ese item ya no tiene stock disponible.')
  }

  const safeQuantityUsed = Number(quantityUsed || 0)
  if (!Number.isFinite(safeQuantityUsed) || safeQuantityUsed <= 0) {
    throw new Error('La cantidad usada no es valida.')
  }

  if (safeQuantityUsed > Number(item.quantity || 0)) {
    throw new Error('La cantidad usada no puede ser mayor que el stock disponible.')
  }

  const nextQuantity = Number(item.quantity || 0) - safeQuantityUsed
  const taskLocation =
    locationUsed?.trim() || task.apartment_or_area?.trim() || ''
  const note = buildConsumeInventoryNote(task, taskLocation)

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ quantity: nextQuantity })
    .eq('id', item.id)
    .eq('quantity', item.quantity)

  if (updateError) {
    const errorText = [
      updateError.message,
      updateError.details,
      updateError.hint,
      updateError.code,
    ]
      .filter(Boolean)
      .join(' | ')
      .toLowerCase()

    if (
      safeQuantityUsed % 1 !== 0 &&
      (errorText.includes('integer') ||
        errorText.includes('numeric') ||
        errorText.includes('invalid input syntax'))
    ) {
      throw new Error(
        'Tu base de datos todavia guarda el inventario en numeros enteros. Corre el script inventory_decimal_quantities.sql para permitir cantidades parciales como 0.5.'
      )
    }

    throw new Error('No se pudo descontar el item del inventario.')
  }

  try {
    await insertInventoryHistoryEntry({
      itemId: item.id,
      actionType: 'stock_adjustment',
      movementType:
        taskLocation && INSTALLED_MOVEMENT_CATEGORIES.has(task.category)
          ? 'installed'
          : 'exit',
      sourceType: 'task',
      sourceId: task.id,
      sourceLabel: task.title.trim(),
      unitLabel: taskLocation || null,
      quantityBefore: item.quantity,
      quantityChange: -safeQuantityUsed,
      quantityAfter: nextQuantity,
      note,
      createdBy: profileId,
    })
  } catch {
    throw new Error('Se desconto el inventario, pero no se pudo registrar el historial.')
  }

  const { error: taskUpdateError } = await supabase
    .from('tasks')
    .update({
      used_inventory_item_id: item.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', task.id)

  if (taskUpdateError) {
    throw new Error('Se desconto el inventario, pero no se pudo enlazar el item a la tarea.')
  }

  const { data: historyRows, error: unitHistoryFetchError } = await supabase
    .from('unit_history')
    .select('id, description, metadata')
    .eq('source_table', 'tasks')
    .eq('source_id', task.id)

  if (unitHistoryFetchError) {
    throw new Error('Se enlazo el item a la tarea, pero no se pudo leer el historial de la unidad.')
  }

  const inventoryNote = `Item de inventario usado: ${item.name.trim()}`
  const rows =
    ((historyRows as Array<{
      id: string
      description: string | null
      metadata: Record<string, unknown> | null
    }> | null) || [])

  await Promise.all(
    rows.map(async (row) => {
      const currentDescription = row.description?.trim() || ''
      const nextDescription = currentDescription.includes(inventoryNote)
        ? currentDescription
        : [currentDescription, inventoryNote].filter(Boolean).join(' | ')

      const { error: unitHistoryUpdateError } = await supabase
        .from('unit_history')
        .update({
          description: nextDescription || null,
          metadata: {
            ...(row.metadata || {}),
            used_inventory_item_id: item.id,
            used_inventory_item_name: item.name.trim(),
            used_inventory_item_type: item.item_type?.trim() || null,
            used_inventory_quantity: safeQuantityUsed,
            used_inventory_location: taskLocation || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      if (unitHistoryUpdateError) {
        throw unitHistoryUpdateError
      }
    })
  )
}

export async function increaseInventoryItemFromTask({
  item,
  task,
  profileId,
}: {
  item: InventoryItem
  task: Task
  profileId: string
}) {
  if (!item.id) {
    throw new Error('No encontramos el item de inventario.')
  }

  const currentQuantity = Number(item.quantity || 0)
  const nextQuantity = currentQuantity + 1
  const taskLocation = task.apartment_or_area?.trim() || ''
  const note = [
    'Entrada desde tarea delivery',
    task.title.trim(),
    taskLocation ? `relacionado con ${taskLocation}` : '',
  ]
    .filter(Boolean)
    .join(' | ')

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({
      quantity: nextQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id)
    .eq('quantity', item.quantity)

  if (updateError) {
    throw new Error('No se pudo aumentar la cantidad del inventario.')
  }

  try {
    await insertInventoryHistoryEntry({
      itemId: item.id,
      actionType: 'stock_adjustment',
      movementType: 'entry',
      sourceType: 'task',
      sourceId: task.id,
      sourceLabel: task.title.trim(),
      unitLabel: taskLocation || null,
      quantityBefore: currentQuantity,
      quantityChange: 1,
      quantityAfter: nextQuantity,
      note,
      createdBy: profileId,
    })
  } catch {
    throw new Error('Se actualizo el inventario, pero no se pudo registrar el historial.')
  }
}

function mergeUniqueValues(baseValues: string[], extraValues: string[]) {
  const merged = [...baseValues]

  extraValues.forEach((value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    const exists = merged.some(
      (item) => item.toLowerCase() === trimmedValue.toLowerCase()
    )

    if (!exists) {
      merged.push(trimmedValue)
    }
  })

  return merged.sort((a, b) => a.localeCompare(b))
}
