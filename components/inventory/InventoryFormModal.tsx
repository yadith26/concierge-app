'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import InventoryFormFields from './InventoryFormFields'
import TaskPhotosSection from '@/components/tasks/TaskPhotosSection'
import { useInventoryForm } from '@/hooks/useInventoryForm'
import type {
  EditableInventoryItem,
  ExistingInventoryPhoto,
  InventoryItem,
} from '@/lib/inventory/inventoryTypes'
import type {
  InventoryConditionSelection,
  SaveInventoryPayload,
} from '@/lib/inventory/inventoryMutations'
import type { SelectedInventoryPhoto } from '@/hooks/useInventoryPhotos'

type InventoryFormModalProps = {
  open: boolean
  saving: boolean
  message: string
  itemToEdit: EditableInventoryItem | null
  initialCategory: string
  initialLocation: string
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
  existingPhotos: ExistingInventoryPhoto[]
  photos: SelectedInventoryPhoto[]
  items?: InventoryItem[]
  availableNames?: string[]
  availableCategories: string[]
  availableLocations: string[]
  onAddCategory: (value: string) => void
  onAddLocation: (value: string) => void
  onUseExistingItem?: (
    item: InventoryItem,
    payload: SaveInventoryPayload
  ) => Promise<void>
  onMessage: (message: string) => void
  onSelectPhotos: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => { ok: boolean; message?: string }
  onRemoveExistingPhoto: (photo: ExistingInventoryPhoto) => void
  onRemoveNewPhoto: (index: number) => void
  onClose: () => void
  onSave: (payload: SaveInventoryPayload) => Promise<void>
}

export default function InventoryFormModal({
  open,
  saving,
  message,
  itemToEdit,
  initialCategory,
  initialLocation,
  initialValues,
  existingPhotos,
  photos,
  items = [],
  availableNames,
  availableCategories,
  availableLocations,
  onAddCategory,
  onAddLocation,
  onUseExistingItem,
  onMessage,
  onSelectPhotos,
  onRemoveExistingPhoto,
  onRemoveNewPhoto,
  onClose,
  onSave,
}: InventoryFormModalProps) {
  const t = useTranslations('inventoryFormModal')

  const inventoryForm = useInventoryForm({
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
    onUseExistingItem: onUseExistingItem || (async () => {}),
    onSave,
  })

  const {
    fields,
    setters,
    dropdowns,
    options,
    suggestedExistingMatches,
    actions,
  } = inventoryForm

  useEffect(() => {
    onMessage('')
  }, [fields.name, fields.category, fields.itemType, fields.unitOfMeasure, onMessage])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-end sm:items-center">
        <div className="flex h-[88vh] w-full flex-col overflow-hidden rounded-t-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:h-[84vh] sm:rounded-[32px]">
          
          {/* HEADER */}
          <div className="sticky top-0 z-10 border-b border-[#E7EDF5] bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#142952]">
                {itemToEdit ? t('editTitle') : t('createTitle')}
              </h2>

              <button
                type="button"
                onClick={onClose}
                aria-label={t('close')}
                className="rounded-xl p-2 text-[#6E7F9D] hover:bg-[#F8FAFE]"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void actions.handleSubmit()
            }}
            className="flex-1 overflow-y-auto px-5 pb-6 pt-5"
          >
            <div className="space-y-5">
              <InventoryFormFields
                fields={fields}
                setters={setters}
                dropdowns={dropdowns}
                options={options}
                suggestedExistingMatches={!itemToEdit ? suggestedExistingMatches : []}
                actions={{
                  handleAddLocation: actions.handleAddLocation,
                  handleUseSuggestedItem: (item) => {
                    void actions.handleUseSuggestedItem(item)
                  },
                }}
              />

              <TaskPhotosSection
                existingPhotos={existingPhotos}
                photos={photos}
                onSelectPhotos={onSelectPhotos}
                onRemoveExistingPhoto={onRemoveExistingPhoto}
                onRemoveNewPhoto={onRemoveNewPhoto}
                onMessage={onMessage}
              />

              {message && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border px-4 py-4"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-[#2F66C8] px-4 py-4 text-white"
              >
                {saving
                  ? itemToEdit
                    ? t('updating')
                    : t('saving')
                  : itemToEdit
                    ? t('update')
                    : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
