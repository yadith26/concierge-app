import type { TranslationValues } from 'next-intl'
import type {
  InventoryActionType,
  InventoryCondition,
  InventoryHistory,
  InventoryMovementType,
} from '@/lib/inventory/inventoryTypes'

type TranslateFn = (key: string, values?: TranslationValues) => string

const INVENTORY_CATEGORY_LABEL_KEYS: Record<string, string> = {
  appliances: 'appliances',
  electrodomesticos: 'appliances',
  electrodomésticos: 'appliances',
  materials: 'materials',
  materiales: 'materials',
  tools: 'tools',
  herramientas: 'tools',
  parts: 'parts',
  piezas: 'parts',
  cleaning: 'cleaning',
  limpieza: 'cleaning',
  other: 'other',
  otros: 'other',
}

const INVENTORY_ITEM_TYPE_LABEL_KEYS: Record<string, string> = {
  refrigerador: 'fridge',
  refrigerator: 'fridge',
  fridge: 'fridge',
  estufa: 'stove',
  stove: 'stove',
  cocina: 'stove',
  microondas: 'microwave',
  microwave: 'microwave',
  'aire acondicionado': 'airConditioner',
  'air conditioner': 'airConditioner',
  lavadora: 'washer',
  washer: 'washer',
  'cemento blanco': 'whiteCement',
  'white cement': 'whiteCement',
  'cemento cola': 'tileAdhesive',
  'tile adhesive': 'tileAdhesive',
  'pintura blanca': 'whitePaint',
  'white paint': 'whitePaint',
  pintura: 'paint',
  paint: 'paint',
  primer: 'primer',
  yeso: 'plaster',
  plaster: 'plaster',
  drywall: 'drywall',
  taladro: 'drill',
  drill: 'drill',
  escalera: 'ladder',
  ladder: 'ladder',
  destornillador: 'screwdriver',
  screwdriver: 'screwdriver',
  martillo: 'hammer',
  hammer: 'hammer',
  bombillo: 'lightBulb',
  'light bulb': 'lightBulb',
  grifo: 'faucet',
  faucet: 'faucet',
  interruptor: 'switch',
  switch: 'switch',
  cerradura: 'lock',
  lock: 'lock',
  detergente: 'detergent',
  detergent: 'detergent',
  desinfectante: 'disinfectant',
  disinfectant: 'disinfectant',
  mopa: 'mop',
  mop: 'mop',
  'bolsas de basura': 'trashBags',
  'trash bags': 'trashBags',
}

const INVENTORY_LOCATION_LABEL_KEYS: Record<string, string> = {
  deposito: 'storage',
  depositó: 'storage',
  depósito: 'storage',
  'storage room': 'storage',
  almacen: 'storage',
  almacén: 'storage',
  'cuarto de mantenimiento': 'maintenanceRoom',
  'maintenance room': 'maintenanceRoom',
  garage: 'garage',
  garaje: 'garage',
  lobby: 'lobby',
}

const INVENTORY_UNIT_LABEL_KEYS: Record<string, string> = {
  unidad: 'unit',
  unidades: 'unit',
  unit: 'unit',
  units: 'unit',
  galon: 'gallon',
  galones: 'gallon',
  gallon: 'gallon',
  gallons: 'gallon',
  lata: 'can',
  latas: 'can',
  can: 'can',
  cans: 'can',
  saco: 'bag',
  sacos: 'bag',
  bag: 'bag',
  bags: 'bag',
  caja: 'box',
  cajas: 'box',
  box: 'box',
  boxes: 'box',
  bolsa: 'pouch',
  bolsas: 'pouch',
  pouch: 'pouch',
  pouches: 'pouch',
  rollo: 'roll',
  rollos: 'roll',
  roll: 'roll',
  rolls: 'roll',
  tubo: 'tube',
  tubos: 'tube',
  tube: 'tube',
  tubes: 'tube',
  botella: 'bottle',
  botellas: 'bottle',
  bottle: 'bottle',
  bottles: 'bottle',
  litro: 'liter',
  litros: 'liter',
  liter: 'liter',
  liters: 'liter',
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  lb: 'lb',
  lbs: 'lb',
  libra: 'lb',
  libras: 'lb',
}

function normalizeInventoryText(value: string | null | undefined) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

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
  fallbackLabel: string,
  t?: TranslateFn
) {
  const rawLabel = location?.trim() || ''
  if (!rawLabel) return fallbackLabel
  if (!t) return rawLabel

  const normalized = normalizeInventoryText(rawLabel)
  const key = INVENTORY_LOCATION_LABEL_KEYS[normalized]
  if (!key) return rawLabel

  return safeTranslate(t, `inventoryTaxonomy.locations.${key}`, rawLabel)
}

export function translateInventoryCategoryLabel(
  category: string | null | undefined,
  t?: TranslateFn
) {
  const rawLabel = category?.trim() || ''
  if (!rawLabel || !t) return rawLabel

  const normalized = normalizeInventoryText(rawLabel)
  const key = INVENTORY_CATEGORY_LABEL_KEYS[normalized]
  if (!key) return rawLabel

  return safeTranslate(t, `inventoryTaxonomy.categories.${key}`, rawLabel)
}

export function getInventoryNotesLabel(
  notes: string | null | undefined,
  fallbackLabel: string
) {
  return notes?.trim() || fallbackLabel
}

export function getInventoryItemTypeLabel(
  item: { item_type?: string | null; name?: string | null },
  t?: TranslateFn,
  fallbackLabel?: string
) {
  const rawLabel = item.item_type?.trim() || fallbackLabel || item.name?.trim() || ''
  if (!rawLabel || !t) return rawLabel

  const normalized = normalizeInventoryText(rawLabel)
  const key = INVENTORY_ITEM_TYPE_LABEL_KEYS[normalized]
  if (!key) return rawLabel

  return safeTranslate(t, `inventoryTaxonomy.itemTypes.${key}`, rawLabel)
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
  t?: TranslateFn,
  quantity?: number | null
) {
  const unit = (unitOfMeasure || '').trim().toLowerCase()
  const safeQuantity = Number(quantity ?? 0)

  const key = INVENTORY_UNIT_LABEL_KEYS[normalizeInventoryText(unit)]
  if (key && t) {
    return safeTranslate(
      t,
      `inventoryTaxonomy.units.${key}`,
      unit || '',
      { count: Math.abs(safeQuantity) }
    )
  }

  if (!unit || unit === 'unidad') {
    return Math.abs(safeQuantity) === 1 ? 'unit' : 'units'
  }

  return unit
}

export function formatInventoryQuantityWithUnit(
  quantity: number | null | undefined,
  unitOfMeasure: string | null | undefined,
  t?: TranslateFn
) {
  return `${formatInventoryQuantity(quantity)} ${getInventoryUnitLabel(
    unitOfMeasure,
    t,
    quantity
  )}`.trim()
}

export function getInventoryHistoryNoteLabel(
  note: string | null | undefined,
  t: TranslateFn
) {
  if (!note) return ''

  const normalizedNote = note
    .trim()
    .replace(/^inventory[,.]history[,.]/, 'inventory.history.')

  if (normalizedNote === 'inventory.history.created') {
    return t('inventory.history.created')
  }
  if (normalizedNote === 'inventory.history.updated') {
    return t('inventory.history.updated')
  }
  if (normalizedNote === 'inventory.history.quickAdd') {
    return t('inventory.history.quickAdd')
  }
  if (normalizedNote === 'inventory.history.quickRemove') {
    return t('inventory.history.quickRemove')
  }

  return normalizedNote
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
    unitOfMeasure,
    t
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
      unitOfMeasure,
      t
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
        unitOfMeasure,
        t
      )}`,
      {
        quantity: formatInventoryQuantityWithUnit(
          entry.quantity_after ?? 0,
          unitOfMeasure,
          t
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
