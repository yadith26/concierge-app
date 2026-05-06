'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import InventoryCombobox from './InventoryCombobox'
import StyledDropdown from '@/components/ui/StyledDropdown'
import { inferInventoryItemFromName } from '@/lib/inventory/inventorySmartParser'
import {
  getMeasurementUnitOptions,
  getSuggestedItemsForCategory,
  isMaterialInventoryCategory,
} from '@/lib/inventory/inventoryCatalog'
import type { InventoryCondition } from '@/lib/inventory/inventoryTypes'

type InventoryFormFieldsProps = {
  fields: {
    name: string
    category: string
    itemType: string
    unitOfMeasure: string
    quantity: string
    minimumStock: string
    location: string
    condition: InventoryCondition | ''
    notes: string
  }
  setters: {
    setName: (value: string) => void
    setCategory: (value: string) => void
    setItemType: (value: string) => void
    setUnitOfMeasure: (value: string) => void
    setQuantity: (value: string) => void
    setMinimumStock: (value: string) => void
    setLocation: (value: string) => void
    setCondition: (value: InventoryCondition | '') => void
    setNotes: (value: string) => void
  }
  dropdowns: {
    nameOpen: boolean
    categoryOpen: boolean
    unitOpen: boolean
    locationOpen: boolean
    handleToggleName: () => void
    handleToggleCategory: () => void
    handleToggleUnit: () => void
    handleToggleLocation: () => void
    handleCloseName: () => void
    handleCloseCategory: () => void
    handleCloseUnit: () => void
    handleCloseLocation: () => void
  }
  options: {
    categories: string[]
    locations: string[]
  }
  actions: {
    handleAddLocation: (value: string) => void
  }
}

export default function InventoryFormFields({
  fields,
  setters,
  dropdowns,
  options,
  actions,
}: InventoryFormFieldsProps) {
  const t = useTranslations('inventoryFormModal')
  const inferredItem = inferInventoryItemFromName(fields.name)
  const displayedSuggestedItem = fields.itemType || inferredItem
  const isMaterial = isMaterialInventoryCategory(fields.category)
  const measurementUnitOptions = useMemo(
    () => getMeasurementUnitOptions(fields.category),
    [fields.category]
  )

  const conditionOptions = [
    { value: '', label: 'Selecciona estado' },
    { value: 'new', label: t('conditions.new') },
    { value: 'used', label: t('conditions.used') },
    { value: 'damaged', label: t('conditions.damaged') },
  ]

  const suggestedItemOptions = useMemo(() => {
    return Array.from(
      new Set(
        [inferredItem, ...getSuggestedItemsForCategory(fields.category)].filter(
          Boolean
        )
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [fields.category, inferredItem])

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {t('name')}
        </label>
        <input
          type="text"
          value={fields.name}
          onChange={(e) => {
            setters.setName(e.target.value)
          }}
          placeholder={t('namePlaceholder')}
          className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none placeholder:text-[#8C9AB3]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InventoryCombobox
          label={t('category')}
          value={fields.category}
          placeholder={t('selectCategory')}
          searchPlaceholder={t('searchCategory')}
          addPlaceholder={t('addCategory')}
          options={options.categories}
          open={dropdowns.categoryOpen}
          onToggle={dropdowns.handleToggleCategory}
          onClose={dropdowns.handleCloseCategory}
          onChange={setters.setCategory}
        />

        <InventoryCombobox
          label={t('suggestedItem')}
          value={displayedSuggestedItem}
          placeholder={t('noSuggestion')}
          searchPlaceholder={t('searchName')}
          addPlaceholder={t('addName')}
          options={suggestedItemOptions}
          open={dropdowns.nameOpen}
          onToggle={dropdowns.handleToggleName}
          onClose={dropdowns.handleCloseName}
          onChange={(value) => {
            setters.setItemType(value)
          }}
          onAddNew={(value) => {
            setters.setItemType(value)
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
            {t('quantity')}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fields.quantity}
            onChange={(e) => setters.setQuantity(e.target.value)}
            className="w-full rounded-2xl border px-4 py-4"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
            {t('condition')}
          </label>
          <StyledDropdown
            ariaLabel={t('condition')}
            value={fields.condition}
            options={conditionOptions}
            onChange={(value) => setters.setCondition(value as InventoryCondition)}
            placeholder="Selecciona estado"
            buttonClassName="py-4 shadow-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
            {t('minimumStock')}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fields.minimumStock}
            onChange={(e) => setters.setMinimumStock(e.target.value)}
            className="w-full rounded-2xl border px-4 py-4"
          />
        </div>
      </div>

      {isMaterial ? (
        <InventoryCombobox
          label={t('measurementUnit')}
          value={fields.unitOfMeasure}
          placeholder={t('selectMeasurementUnit')}
          searchPlaceholder={t('searchMeasurementUnit')}
          addPlaceholder={t('addMeasurementUnit')}
          options={measurementUnitOptions}
          open={dropdowns.unitOpen}
          onToggle={dropdowns.handleToggleUnit}
          onClose={dropdowns.handleCloseUnit}
          onChange={setters.setUnitOfMeasure}
          onAddNew={setters.setUnitOfMeasure}
        />
      ) : null}

      <InventoryCombobox
        label={t('location')}
        value={fields.location}
        placeholder={t('selectLocation')}
        searchPlaceholder={t('searchLocation')}
        addPlaceholder={t('addLocation')}
        options={options.locations}
        open={dropdowns.locationOpen}
        onToggle={dropdowns.handleToggleLocation}
        onClose={dropdowns.handleCloseLocation}
        onChange={setters.setLocation}
        onAddNew={actions.handleAddLocation}
      />

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {t('notes')}
        </label>
        <textarea
          value={fields.notes}
          onChange={(e) => setters.setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
          rows={4}
          className="w-full rounded-2xl border px-4 py-4"
        />
      </div>
    </>
  )
}
