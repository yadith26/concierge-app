'use client'

import { supabase } from '@/lib/supabase'
import { resolveConciergeBuildingContext } from '@/lib/buildings/conciergeBuildingContext'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'
import { normalizeInventoryCategory } from '@/lib/inventory/inventoryCatalog'
import {
  DEFAULT_INVENTORY_CATEGORIES,
  DEFAULT_INVENTORY_LOCATIONS,
} from '@/lib/inventory/inventoryMutations'
import type {
  InventoryHistory,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'

type LoadInventoryPageDataResult = {
  profileId: string
  buildingId: string
  buildingName: string
  buildings: BuildingSummary[]
  items: InventoryItem[]
  history: InventoryHistory[]
  availableCategories: string[]
  availableLocations: string[]
}

export async function loadInventoryPageData(
  preferredBuildingId?: string | null
): Promise<LoadInventoryPageDataResult> {
  const { profileId, buildings, building } =
    await resolveConciergeBuildingContext(preferredBuildingId)

  if (!building) {
    throw new Error('Missing building')
  }

  let itemsData: InventoryItem[] | null = null

  const itemsWithPhotosResponse = await supabase
    .from('inventory_items')
    .select(`
      *,
      inventory_item_photos (
        id,
        image_url
      )
    `)
    .eq('building_id', building.id)
    .order('updated_at', { ascending: false })

  if (itemsWithPhotosResponse.error) {
    const fallbackResponse = await supabase
      .from('inventory_items')
      .select('*')
      .eq('building_id', building.id)
      .order('updated_at', { ascending: false })

    if (fallbackResponse.error) {
      throw new Error(fallbackResponse.error.message)
    }

    itemsData = (fallbackResponse.data as InventoryItem[]) || []
  } else {
    itemsData = (itemsWithPhotosResponse.data as InventoryItem[]) || []
  }

  const items = (itemsData || []).map((item) => ({
    ...item,
    category: normalizeInventoryCategory(item.category),
  }))

  const visibleItems = items.filter((item) => Number(item.quantity || 0) > 0)

  const availableCategories = DEFAULT_INVENTORY_CATEGORIES.filter((category) =>
    visibleItems.some(
      (item) =>
        (item.category || '').trim().toLowerCase() === category.toLowerCase()
    )
  )

  const availableLocations = [...DEFAULT_INVENTORY_LOCATIONS]
  visibleItems.forEach((item) => {
    const value = item.location?.trim()
    if (
      value &&
      !availableLocations.some(
        (location) => location.toLowerCase() === value.toLowerCase()
      )
    ) {
      availableLocations.push(value)
    }
  })

  let history: InventoryHistory[] = []
  if (items.length > 0) {
    const itemIds = items.map((item) => item.id)

    const { data: historyData, error: historyError } = await supabase
      .from('inventory_history')
      .select('*')
      .in('item_id', itemIds)
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('Error fetching history:', historyError)
    } else {
      history = (historyData as InventoryHistory[]) || []
    }
  }

  return {
    profileId,
    buildingId: building.id,
    buildingName: building.name,
    buildings,
    items,
    history,
    availableCategories,
    availableLocations,
  }
}
