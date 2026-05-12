'use client'

import { useMemo, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import InventoryCombobox from './InventoryCombobox'
import StyledDropdown from '@/components/ui/StyledDropdown'
import { inferInventoryItemFromName } from '@/lib/inventory/inventorySmartParser'
import {
  getMeasurementUnitOptions,
  getSuggestedItemsForCategory,
  isMaterialInventoryCategory,
} from '@/lib/inventory/inventoryCatalog'
import type { InventoryCondition } from '@/lib/inventory/inventoryTypes'

type SpeechRecognitionResultLike = {
  transcript?: string
}

type SpeechRecognitionAlternativeListLike =
  ArrayLike<SpeechRecognitionResultLike>

type SpeechRecognitionResultLikeWithFinal =
  SpeechRecognitionAlternativeListLike & {
    isFinal?: boolean
  }

type SpeechRecognitionResultListLike =
  ArrayLike<SpeechRecognitionResultLikeWithFinal>

type SpeechRecognitionEventLike = Event & {
  results?: SpeechRecognitionResultListLike
}

type SpeechRecognitionLike = {
  lang: string
  continuous?: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

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
  const locale = useLocale()
  const [isListeningName, setIsListeningName] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
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

  const getSpeechLang = () => {
    if (locale.startsWith('en')) return 'en-US'
    if (locale.startsWith('fr')) return 'fr-CA'
    if (locale.startsWith('ru')) return 'ru-RU'
    return 'es-ES'
  }

  const handleToggleNameDictation = () => {
    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }

    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(t('dictationUnsupported'))
      return
    }

    if (isListeningName) {
      recognitionRef.current?.stop()
      setIsListeningName(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = getSpeechLang()
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    setIsListeningName(true)

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = ''
      const results = event.results
      if (!results) return

      for (let index = 0; index < results.length; index += 1) {
        transcript += results[index]?.[0]?.transcript || ''
      }

      setters.setName(transcript.trim())
    }

    recognition.onerror = () => {
      setIsListeningName(false)
    }

    recognition.onend = () => {
      setIsListeningName(false)
    }

    recognition.start()
  }

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {t('name')}
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-[#E7EDF5] bg-white px-3 py-2 transition focus-within:border-[#BCD1F3] focus-within:ring-2 focus-within:ring-[#EAF2FF]">
          <input
            type="text"
            value={fields.name}
            onChange={(e) => {
              setters.setName(e.target.value)
            }}
            placeholder={isListeningName ? t('listening') : t('namePlaceholder')}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-[#142952] outline-none placeholder:text-[#8C9AB3]"
          />

          <button
            type="button"
            onClick={handleToggleNameDictation}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
              isListeningName
                ? 'bg-[#E85757] text-white shadow-[0_8px_20px_rgba(232,87,87,0.28)]'
                : 'bg-[#EEF4FF] text-[#4D66DA]'
            }`}
            aria-label={
              isListeningName ? t('stopNameDictation') : t('startNameDictation')
            }
          >
            {isListeningName ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E85757] opacity-40" />
            ) : null}
            <Mic size={19} className="relative" />
          </button>
        </div>

        {isListeningName ? (
          <p className="mt-2 text-[12px] font-medium text-[#E85757]">
            {t('listeningHint')}
          </p>
        ) : null}
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
