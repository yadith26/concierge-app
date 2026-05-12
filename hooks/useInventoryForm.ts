'use client'

import { useEffect, useMemo, useReducer, useRef } from 'react'
import {
  inferInventoryCategoryFromName,
  inferInventoryItemFromName,
} from '@/lib/inventory/inventorySmartParser'
import {
  getDefaultMeasurementUnit,
  isMaterialInventoryCategory,
} from '@/lib/inventory/inventoryCatalog'
import {
  rankMatchingInventoryItemsDetailed,
  type RankedInventoryMatch,
} from '@/lib/inventory/findMatchingInventoryItem'
import {
  getUniqueCaseInsensitiveValues,
  INITIAL_INVENTORY_FORM_STATE,
  inventoryFormReducer,
  type InventoryConditionSelection,
} from '@/lib/inventory/inventoryFormHelpers'
import type {
  EditableInventoryItem,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'

type UseInventoryFormParams = {
  open: boolean
  itemToEdit: EditableInventoryItem | null
  initialCategory: string
  initialLocation: string
  items: InventoryItem[]
  availableNames?: string[]
  initialValues?: {
    name?: string
    category?: string
    item_type?: string
    unit_of_measure?: string
    quantity?: number
    minimum_stock?: number
    location?: string
    condition?: InventoryConditionSelection
    notes?: string
  } | null
  availableCategories: string[]
  availableLocations: string[]
  onAddCategory: (value: string) => void
  onAddLocation: (value: string) => void
  onUseExistingItem: (
    item: InventoryItem,
    payload: {
      name: string
      category: string
      item_type: string
      unit_of_measure: string
      quantity: number
      minimum_stock: number
      location: string
      condition: InventoryConditionSelection
      notes: string
    }
  ) => Promise<void>
  onSave: (payload: {
    name: string
    category: string
    item_type: string
    unit_of_measure: string
    quantity: number
    minimum_stock: number
    location: string
    condition: InventoryConditionSelection
    notes: string
  }) => Promise<void>
}

export function useInventoryForm({
  open,
  itemToEdit,
  initialCategory,
  initialLocation,
  items,
  availableNames,
  initialValues,
  availableCategories,
  availableLocations,
  onAddCategory,
  onAddLocation,
  onUseExistingItem,
  onSave,
}: UseInventoryFormParams) {
  const [state, dispatch] = useReducer(
    inventoryFormReducer,
    INITIAL_INVENTORY_FORM_STATE
  )
  const lastAutoCategoryRef = useRef('')
  const lastAutoItemTypeRef = useRef('')

  useEffect(() => {
    if (!open) return

    if (itemToEdit) {
      lastAutoCategoryRef.current = ''
      dispatch({
        type: 'reset',
        payload: {
          name: itemToEdit.name,
          category: itemToEdit.category,
          itemType: itemToEdit.item_type || '',
          unitOfMeasure:
            itemToEdit.unit_of_measure ||
            getDefaultMeasurementUnit(itemToEdit.category),
          quantity: itemToEdit.quantity,
          minimumStock: itemToEdit.minimum_stock,
          location: itemToEdit.location,
          condition: itemToEdit.condition,
          notes: itemToEdit.notes,
        },
      })
    } else {
      lastAutoCategoryRef.current = initialValues?.category || initialCategory || ''
      lastAutoItemTypeRef.current = initialValues?.item_type || ''
      dispatch({
        type: 'reset',
        payload: {
          name: initialValues?.name || '',
          category: initialValues?.category || initialCategory || '',
          itemType: initialValues?.item_type || '',
          unitOfMeasure:
            initialValues?.unit_of_measure ||
            getDefaultMeasurementUnit(initialValues?.category || initialCategory),
          quantity: String(initialValues?.quantity ?? 1),
          minimumStock: String(initialValues?.minimum_stock ?? 0),
          location: initialValues?.location || initialLocation || '',
          condition: initialValues?.condition || '',
          notes: initialValues?.notes || '',
        },
      })
    }
  }, [open, itemToEdit, initialCategory, initialLocation, initialValues])

  useEffect(() => {
    if (!open || itemToEdit) return

    const inferredCategory = inferInventoryCategoryFromName(state.name)
    if (inferredCategory && (!state.category || state.category === lastAutoCategoryRef.current)) {
      lastAutoCategoryRef.current = inferredCategory
      dispatch({ type: 'setCategory', value: inferredCategory })
    }

    const inferredItemType = inferInventoryItemFromName(state.name)
    if (inferredItemType && (!state.itemType || state.itemType === lastAutoItemTypeRef.current)) {
      lastAutoItemTypeRef.current = inferredItemType
      dispatch({ type: 'setItemType', value: inferredItemType })
    }
  }, [open, itemToEdit, state.name, state.category, state.itemType])

  useEffect(() => {
    if (!open) return

    if (!isMaterialInventoryCategory(state.category)) {
      if (state.unitOfMeasure !== 'unidad') {
        dispatch({ type: 'setUnitOfMeasure', value: 'unidad' })
      }
      return
    }

    if (!state.unitOfMeasure.trim()) {
      dispatch({
        type: 'setUnitOfMeasure',
        value: getDefaultMeasurementUnit(state.category),
      })
    }
  }, [open, state.category, state.unitOfMeasure])

  const normalizedCategories = useMemo(
    () => getUniqueCaseInsensitiveValues(availableCategories),
    [availableCategories]
  )

  const normalizedLocations = useMemo(
    () => getUniqueCaseInsensitiveValues(availableLocations),
    [availableLocations]
  )

  const suggestedExistingMatches = useMemo(() => {
    if (!open || itemToEdit || !state.name.trim()) return [] as RankedInventoryMatch<InventoryItem>[]

    const ranked = rankMatchingInventoryItemsDetailed(items, {
      textToMatch: state.name.trim(),
      preferredCategory: state.category.trim(),
      preferredItemLabel: state.itemType.trim() || state.name.trim(),
    })

    const bestMatch = ranked[0]
    if (!bestMatch) return [] as RankedInventoryMatch<InventoryItem>[]

    const strongMatch =
      bestMatch.score >= 100 ||
      bestMatch.reasons.includes('exact_name') ||
      bestMatch.reasons.includes('exact_item_type') ||
      bestMatch.reasons.includes('preferred_name') ||
      bestMatch.reasons.includes('preferred_item_type')

    if (!strongMatch) return [] as RankedInventoryMatch<InventoryItem>[]

    return ranked.slice(0, 4)
  }, [open, itemToEdit, items, state.name, state.category, state.itemType])

  const suggestedExistingItem = suggestedExistingMatches[0]?.item || null

  const handleToggleCategory = () => {
    dispatch({ type: 'toggleCategory' })
  }

  const handleToggleName = () => {
    dispatch({ type: 'toggleName' })
  }

  const handleToggleLocation = () => {
    dispatch({ type: 'toggleLocation' })
  }

  const handleToggleUnit = () => {
    dispatch({ type: 'toggleUnit' })
  }

  const handleCloseCategory = () => {
    dispatch({ type: 'closeCategory' })
  }

  const handleCloseName = () => {
    dispatch({ type: 'closeName' })
  }

  const handleCloseLocation = () => {
    dispatch({ type: 'closeLocation' })
  }

  const handleCloseUnit = () => {
    dispatch({ type: 'closeUnit' })
  }

  const handleAddCategory = (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    onAddCategory(trimmedValue)
    dispatch({ type: 'setCategory', value: trimmedValue })
    dispatch({ type: 'closeCategory' })
  }

  const handleAddLocation = (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    onAddLocation(trimmedValue)
    dispatch({ type: 'setLocation', value: trimmedValue })
    dispatch({ type: 'closeLocation' })
  }

  const handleSubmit = async () => {
    await onSave({
      name: state.name.trim(),
      category: state.category.trim(),
      item_type: state.itemType.trim(),
      unit_of_measure: state.unitOfMeasure.trim(),
      quantity: Number(state.quantity || 0),
      minimum_stock: Number(state.minimumStock || 0),
      location: state.location.trim(),
      condition: state.condition,
      notes: state.notes.trim(),
    })
  }

  const handleUseSuggestedItem = async (item?: InventoryItem) => {
    const targetItem = item || suggestedExistingItem
    if (!targetItem) return

    await onUseExistingItem(targetItem, {
      name: state.name.trim(),
      category: state.category.trim(),
      item_type: state.itemType.trim(),
      unit_of_measure: state.unitOfMeasure.trim(),
      quantity: Number(state.quantity || 0),
      minimum_stock: Number(state.minimumStock || 0),
      location: state.location.trim(),
      condition: state.condition,
      notes: state.notes.trim(),
    })
  }

  return {
    fields: {
      name: state.name,
      category: state.category,
      itemType: state.itemType,
      unitOfMeasure: state.unitOfMeasure,
      quantity: state.quantity,
      minimumStock: state.minimumStock,
      location: state.location,
      condition: state.condition,
      notes: state.notes,
    },
    setters: {
      setName: (value: string) => dispatch({ type: 'setName', value }),
      setCategory: (value: string) => {
        lastAutoCategoryRef.current = value
        dispatch({ type: 'setCategory', value })
      },
      setItemType: (value: string) => {
        lastAutoItemTypeRef.current = value
        dispatch({ type: 'setItemType', value })
      },
      setUnitOfMeasure: (value: string) =>
        dispatch({ type: 'setUnitOfMeasure', value }),
      setQuantity: (value: string) => dispatch({ type: 'setQuantity', value }),
      setMinimumStock: (value: string) =>
        dispatch({ type: 'setMinimumStock', value }),
      setLocation: (value: string) => dispatch({ type: 'setLocation', value }),
      setCondition: (value: InventoryConditionSelection) =>
        dispatch({ type: 'setCondition', value }),
      setNotes: (value: string) => dispatch({ type: 'setNotes', value }),
    },
    dropdowns: {
      nameOpen: state.nameOpen,
      categoryOpen: state.categoryOpen,
      unitOpen: state.unitOpen,
      locationOpen: state.locationOpen,
      handleToggleName,
      handleToggleCategory,
      handleToggleUnit,
      handleToggleLocation,
      handleCloseName,
      handleCloseCategory,
      handleCloseUnit,
      handleCloseLocation,
    },
    options: {
      categories: normalizedCategories,
      locations: normalizedLocations,
      names: getUniqueCaseInsensitiveValues(availableNames || []),
    },
    suggestedExistingItem,
    suggestedExistingMatches,
    actions: {
      handleAddCategory,
      handleAddLocation,
      handleSubmit,
      handleUseSuggestedItem,
    },
  }
}
