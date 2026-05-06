import type { InventoryCondition } from '@/lib/inventory/inventoryTypes'

export type InventoryConditionSelection = InventoryCondition | ''

export type InventoryFormState = {
  name: string
  category: string
  itemType: string
  unitOfMeasure: string
  quantity: string
  minimumStock: string
  location: string
  condition: InventoryConditionSelection
  notes: string
  nameOpen: boolean
  categoryOpen: boolean
  unitOpen: boolean
  locationOpen: boolean
}

export type InventoryFormAction =
  | {
      type: 'reset'
      payload: {
        name: string
        category: string
        itemType: string
        unitOfMeasure: string
        quantity: string
        minimumStock: string
        location: string
        condition: InventoryConditionSelection
        notes: string
      }
    }
  | { type: 'setName'; value: string }
  | { type: 'setCategory'; value: string }
  | { type: 'setItemType'; value: string }
  | { type: 'setUnitOfMeasure'; value: string }
  | { type: 'setQuantity'; value: string }
  | { type: 'setMinimumStock'; value: string }
  | { type: 'setLocation'; value: string }
  | { type: 'setCondition'; value: InventoryConditionSelection }
  | { type: 'setNotes'; value: string }
  | { type: 'toggleName' }
  | { type: 'toggleCategory' }
  | { type: 'toggleUnit' }
  | { type: 'toggleLocation' }
  | { type: 'closeName' }
  | { type: 'closeCategory' }
  | { type: 'closeUnit' }
  | { type: 'closeLocation' }

export const INITIAL_INVENTORY_FORM_STATE: InventoryFormState = {
  name: '',
  category: '',
  itemType: '',
  unitOfMeasure: 'unidad',
  quantity: '1',
  minimumStock: '0',
  location: '',
  condition: '',
  notes: '',
  nameOpen: false,
  categoryOpen: false,
  unitOpen: false,
  locationOpen: false,
}

export function getUniqueCaseInsensitiveValues(values: string[]) {
  const result: string[] = []

  values.forEach((value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    const exists = result.some(
      (item) => item.toLowerCase() === trimmedValue.toLowerCase()
    )

    if (!exists) {
      result.push(trimmedValue)
    }
  })

  return result.sort((a, b) => a.localeCompare(b))
}

export function inventoryFormReducer(
  state: InventoryFormState,
  action: InventoryFormAction
): InventoryFormState {
  switch (action.type) {
    case 'reset':
      return {
        ...state,
        ...action.payload,
        nameOpen: false,
        categoryOpen: false,
        unitOpen: false,
        locationOpen: false,
      }
    case 'setName':
      return { ...state, name: action.value }
    case 'setCategory':
      return { ...state, category: action.value }
    case 'setItemType':
      return { ...state, itemType: action.value }
    case 'setUnitOfMeasure':
      return { ...state, unitOfMeasure: action.value }
    case 'setQuantity':
      return { ...state, quantity: action.value }
    case 'setMinimumStock':
      return { ...state, minimumStock: action.value }
    case 'setLocation':
      return { ...state, location: action.value }
    case 'setCondition':
      return { ...state, condition: action.value }
    case 'setNotes':
      return { ...state, notes: action.value }
    case 'toggleName':
      return {
        ...state,
        nameOpen: !state.nameOpen,
        categoryOpen: false,
        locationOpen: false,
      }
    case 'toggleCategory':
      return {
        ...state,
        categoryOpen: !state.categoryOpen,
        nameOpen: false,
        unitOpen: false,
        locationOpen: false,
      }
    case 'toggleUnit':
      return {
        ...state,
        unitOpen: !state.unitOpen,
        nameOpen: false,
        categoryOpen: false,
        locationOpen: false,
      }
    case 'toggleLocation':
      return {
        ...state,
        locationOpen: !state.locationOpen,
        nameOpen: false,
        categoryOpen: false,
        unitOpen: false,
      }
    case 'closeName':
      return { ...state, nameOpen: false }
    case 'closeCategory':
      return { ...state, categoryOpen: false }
    case 'closeUnit':
      return { ...state, unitOpen: false }
    case 'closeLocation':
      return { ...state, locationOpen: false }
    default:
      return state
  }
}
