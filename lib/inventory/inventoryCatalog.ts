export const INVENTORY_CATEGORY_ITEMS = {
  es: {
    Appliances: [
      'Refrigerador',
      'Estufa',
      'Microondas',
      'Aire acondicionado',
      'Lavadora',
    ],
    Materials: [
      'Pintura',
      'Cemento blanco',
      'Cemento cola',
      'Pintura blanca',
      'Primer',
      'Yeso',
      'Drywall',
    ],
    Tools: ['Taladro', 'Escalera', 'Destornillador', 'Martillo'],
    Parts: ['Bombillo', 'Grifo', 'Interruptor', 'Cerradura'],
    Cleaning: ['Detergente', 'Desinfectante', 'Mopa', 'Bolsas de basura'],
    Other: [],
  },
  en: {
    Appliances: [
      'Fridge',
      'Stove',
      'Microwave',
      'Air conditioner',
      'Washer',
    ],
    Materials: [
      'Paint',
      'White cement',
      'Tile adhesive',
      'White paint',
      'Primer',
      'Plaster',
      'Drywall',
    ],
    Tools: ['Drill', 'Ladder', 'Screwdriver', 'Hammer'],
    Parts: ['Light bulb', 'Faucet', 'Switch', 'Lock'],
    Cleaning: ['Detergent', 'Disinfectant', 'Mop', 'Trash bags'],
    Other: [],
  },
} as const

export const MATERIAL_MEASUREMENT_UNIT_OPTIONS = [
  'unidad',
  'lata',
  'galon',
  'saco',
  'caja',
  'bolsa',
  'rollo',
  'tubo',
  'botella',
  'litro',
  'kg',
  'lb',
] as const

export const INVENTORY_CATEGORY_OPTIONS = Object.keys(
  INVENTORY_CATEGORY_ITEMS.es
) as InventoryCatalogCategory[]

export type InventoryCatalogCategory = keyof typeof INVENTORY_CATEGORY_ITEMS.es

const INVENTORY_CATEGORY_ALIASES: Record<string, InventoryCatalogCategory> = {
  appliance: 'Appliances',
  appliances: 'Appliances',
  items: 'Appliances',
  'kitchen appliance': 'Appliances',
  'kitchen appliances': 'Appliances',
  'laundry appliance': 'Appliances',
  'laundry appliances': 'Appliances',
  hvac: 'Appliances',
  furniture: 'Other',
  material: 'Materials',
  materials: 'Materials',
  supplies: 'Materials',
  construction: 'Materials',
  paint: 'Materials',
  painting: 'Materials',
  plumbing: 'Parts',
  electrical: 'Parts',
  part: 'Parts',
  parts: 'Parts',
  tool: 'Tools',
  tools: 'Tools',
  cleaning: 'Cleaning',
  pest: 'Other',
  'pest control': 'Other',
  other: 'Other',
}

function resolveInventoryCatalogLocale(locale?: string) {
  return locale?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function getSuggestedItemsForCategory(category: string, locale?: string) {
  const catalogLocale = resolveInventoryCatalogLocale(locale)
  return [
    ...(INVENTORY_CATEGORY_ITEMS[catalogLocale][
      normalizeInventoryCategory(category) as InventoryCatalogCategory
    ] || []),
  ]
}

export function getAllSuggestedInventoryItems(locale?: string) {
  const catalogLocale = resolveInventoryCatalogLocale(locale)
  return Array.from(
    new Set(
      Object.values(INVENTORY_CATEGORY_ITEMS[catalogLocale])
        .flat()
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))
}

export function isMaterialInventoryCategory(category: string | null | undefined) {
  return normalizeInventoryCategory(category) === 'Materials'
}

export function getMeasurementUnitOptions(
  category: string | null | undefined
) {
  if (isMaterialInventoryCategory(category)) {
    return [...MATERIAL_MEASUREMENT_UNIT_OPTIONS]
  }

  return ['unidad']
}

export function getDefaultMeasurementUnit(
  category: string | null | undefined
) {
  return isMaterialInventoryCategory(category) ? 'unidad' : 'unidad'
}

export function normalizeMeasurementUnit(
  value: string | null | undefined,
  category: string | null | undefined
) {
  const trimmedValue = (value || '').trim().toLowerCase()

  if (!trimmedValue) {
    return getDefaultMeasurementUnit(category)
  }

  return trimmedValue
}

export function normalizeInventoryCategory(category: string | null | undefined) {
  const trimmedValue = (category || '').trim()
  if (!trimmedValue) return 'Other'

  const directMatch = INVENTORY_CATEGORY_OPTIONS.find(
    (option) => option.toLowerCase() === trimmedValue.toLowerCase()
  )

  if (directMatch) {
    return directMatch
  }

  return INVENTORY_CATEGORY_ALIASES[trimmedValue.toLowerCase()] || 'Other'
}
