import { normalizeInventoryCategory } from '@/lib/inventory/inventoryCatalog'

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'Appliances',
    keywords: [
      'refrigerador',
      'nevera',
      'fridge',
      'refrigerator',
      'estufa',
      'fogon',
      'fogon',
      'cocina',
      'stove',
      'range',
      'oven',
      'microondas',
      'microwave',
      'aire acondicionado',
      'air conditioner',
      'lavadora',
      'washer',
      'dryer',
      'secadora',
    ],
  },
  {
    category: 'Materials',
    keywords: [
      'cemento',
      'cement',
      'drywall',
      'primer',
      'yeso',
      'gypsum',
      'pintura',
      'paint',
      'rodillo',
      'roller',
      'mortero',
      'mortar',
    ],
  },
  {
    category: 'Tools',
    keywords: [
      'taladro',
      'drill',
      'escalera',
      'ladder',
      'destornillador',
      'screwdriver',
      'martillo',
      'hammer',
      'llave',
      'wrench',
    ],
  },
  {
    category: 'Parts',
    keywords: [
      'bombillo',
      'bulb',
      'grifo',
      'faucet',
      'interruptor',
      'switch',
      'cerradura',
      'lock',
      'tomacorriente',
      'outlet',
      'socket',
      'breaker',
    ],
  },
  {
    category: 'Cleaning',
    keywords: [
      'detergente',
      'detergent',
      'desinfectante',
      'disinfectant',
      'mopa',
      'mop',
      'bolsas de basura',
      'trash bags',
      'cloro',
      'bleach',
    ],
  },
]

const ITEM_KEYWORDS: Array<{ item: string; keywords: string[] }> = [
  {
    item: 'Refrigerador',
    keywords: ['refrigerador', 'nevera', 'fridge', 'refrigerator'],
  },
  {
    item: 'Estufa',
    keywords: ['estufa', 'fogon', 'cocina', 'stove', 'range', 'oven'],
  },
  {
    item: 'Microondas',
    keywords: ['microondas', 'microwave'],
  },
  {
    item: 'Aire acondicionado',
    keywords: ['aire acondicionado', 'air conditioner'],
  },
  {
    item: 'Lavadora',
    keywords: ['lavadora', 'washer', 'secadora', 'dryer'],
  },
  {
    item: 'Cemento blanco',
    keywords: ['cemento blanco', 'white cement'],
  },
  {
    item: 'Cemento cola',
    keywords: ['cemento cola', 'tile adhesive'],
  },
  {
    item: 'Drywall',
    keywords: ['drywall'],
  },
  {
    item: 'Primer',
    keywords: ['primer'],
  },
  {
    item: 'Yeso',
    keywords: ['yeso', 'gypsum'],
  },
  {
    item: 'Pintura',
    keywords: ['pintura blanca', 'white paint', 'pintura', 'paint'],
  },
  {
    item: 'Taladro',
    keywords: ['taladro', 'drill'],
  },
  {
    item: 'Escalera',
    keywords: ['escalera', 'ladder'],
  },
  {
    item: 'Destornillador',
    keywords: ['destornillador', 'screwdriver'],
  },
  {
    item: 'Martillo',
    keywords: ['martillo', 'hammer'],
  },
  {
    item: 'Bombillo',
    keywords: ['bombillo', 'bulb'],
  },
  {
    item: 'Grifo',
    keywords: ['grifo', 'faucet'],
  },
  {
    item: 'Interruptor',
    keywords: ['interruptor', 'switch'],
  },
  {
    item: 'Cerradura',
    keywords: ['cerradura', 'lock'],
  },
  {
    item: 'Detergente',
    keywords: ['detergente', 'detergent'],
  },
  {
    item: 'Desinfectante',
    keywords: ['desinfectante', 'disinfectant'],
  },
  {
    item: 'Mopa',
    keywords: ['mopa', 'mop'],
  },
  {
    item: 'Bolsas de basura',
    keywords: ['bolsas de basura', 'trash bags'],
  },
]

export function inferInventoryCategoryFromName(name: string) {
  const normalizedName = name.trim().toLowerCase()
  if (!normalizedName) return ''

  const match = CATEGORY_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  )

  return match ? normalizeInventoryCategory(match.category) : ''
}

export function inferInventoryItemFromName(name: string) {
  const normalizedName = name.trim().toLowerCase()
  if (!normalizedName) return ''

  const match = ITEM_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  )

  return match?.item || ''
}
