import { normalizeText } from '@/lib/utils/normalizeText'
import { normalizeInventoryCategory } from '@/lib/inventory/inventoryCatalog'

export type InventoryItemForMatch = {
  id: string
  name?: string | null
  item_name?: string | null
  variant_name?: string | null
  item_type?: string | null
  category?: string | null
  quantity?: number | null
}

type MatchOptions = {
  textToMatch: string
  preferredCategory?: string | null
  preferredItemLabel?: string | null
}

export type InventoryMatchReason =
  | 'exact_name'
  | 'exact_item_type'
  | 'exact_variant'
  | 'contains_name'
  | 'contains_item_type'
  | 'contains_variant'
  | 'preferred_name'
  | 'preferred_item_type'
  | 'preferred_partial_name'
  | 'same_category'
  | 'shared_tokens'

export type RankedInventoryMatch<T extends InventoryItemForMatch> = {
  item: T
  score: number
  reasons: InventoryMatchReason[]
}

function getItemTexts(item: InventoryItemForMatch) {
  return {
    name: normalizeText(item.name || item.item_name),
    variant: normalizeText(item.variant_name),
    itemType: normalizeText(item.item_type),
    category: normalizeInventoryCategory(item.category),
  }
}

function scoreInventoryItemMatch(
  item: InventoryItemForMatch,
  normalizedTaskText: string,
  preferredCategory: string,
  preferredItemLabel: string
): { score: number; reasons: InventoryMatchReason[] } {
  const { name, variant, itemType, category } = getItemTexts(item)
  const candidateText = [name, variant, itemType].filter(Boolean).join(' ')

  if (!candidateText) return { score: 0, reasons: [] }

  let score = 0
  const reasons = new Set<InventoryMatchReason>()

  if (preferredCategory && category === preferredCategory) {
    score += 35
    reasons.add('same_category')
  }

  if (preferredItemLabel) {
    if (itemType === preferredItemLabel) {
      score += 90
      reasons.add('preferred_item_type')
    }
    else if (name === preferredItemLabel) {
      score += 80
      reasons.add('preferred_name')
    }
    else if (itemType.includes(preferredItemLabel) || name.includes(preferredItemLabel)) {
      score += 55
      reasons.add('preferred_partial_name')
    }
  }

  if (name && normalizedTaskText === name) {
    score += 120
    reasons.add('exact_name')
  }
  else if (itemType && normalizedTaskText === itemType) {
    score += 110
    reasons.add('exact_item_type')
  }
  else if (variant && normalizedTaskText === variant) {
    score += 95
    reasons.add('exact_variant')
  }

  if (name && normalizedTaskText.includes(name)) {
    score += 70
    reasons.add('contains_name')
  }
  if (itemType && normalizedTaskText.includes(itemType)) {
    score += 65
    reasons.add('contains_item_type')
  }
  if (variant && normalizedTaskText.includes(variant)) {
    score += 50
    reasons.add('contains_variant')
  }

  const taskTokens = normalizedTaskText.split(' ').filter((token) => token.length > 2)
  const matchedTokens = taskTokens.filter((token) => candidateText.includes(token)).length
  score += matchedTokens * 12
  if (matchedTokens > 0) {
    reasons.add('shared_tokens')
  }

  return { score, reasons: Array.from(reasons) }
}

export function rankMatchingInventoryItemsDetailed<T extends InventoryItemForMatch>(
  items: T[],
  { textToMatch, preferredCategory, preferredItemLabel }: MatchOptions
): RankedInventoryMatch<T>[] {
  const normalizedTaskText = normalizeText(textToMatch)
  const normalizedPreferredCategory = normalizeInventoryCategory(preferredCategory)
  const normalizedPreferredItemLabel = normalizeText(preferredItemLabel)

  if (!normalizedTaskText && !normalizedPreferredItemLabel) return []

  return items
    .map((item) => {
      const result = scoreInventoryItemMatch(
        item,
        normalizedTaskText,
        normalizedPreferredCategory,
        normalizedPreferredItemLabel
      )

      return {
        item,
        score: result.score,
        reasons: result.reasons,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return Number(b.item.quantity || 0) - Number(a.item.quantity || 0)
    })
}

export function rankMatchingInventoryItems<T extends InventoryItemForMatch>(
  items: T[],
  options: MatchOptions
) {
  return rankMatchingInventoryItemsDetailed(items, options)
    .map((entry) => entry.item)
}

export function findMatchingInventoryItem<T extends InventoryItemForMatch>(
  items: T[],
  textToMatch: string
) {
  const matches = rankMatchingInventoryItems(items, { textToMatch })
  return matches[0] || null
}
