'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

type InventoryComboboxProps = {
  label: string
  value: string
  placeholder: string
  searchPlaceholder: string
  addPlaceholder: string
  options: string[]
  open: boolean
  onToggle: () => void
  onClose: () => void
  onChange: (value: string) => void
  onAddNew?: (value: string) => void
  zIndexClassName?: string
}

export default function InventoryCombobox({
  label,
  value,
  placeholder,
  searchPlaceholder,
  addPlaceholder,
  options,
  open,
  onToggle,
  onClose,
  onChange,
  onAddNew,
  zIndexClassName = 'z-20',
}: InventoryComboboxProps) {
  const t = useTranslations('inventoryCombobox')

  const rootRef = useRef<HTMLDivElement | null>(null)
  const [search, setSearch] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    if (!open) {
      setSearch('')
      setNewValue('')
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const safeOptions = options ?? []

  const filteredOptions = useMemo(() => {
    const searchValue = search.toLowerCase().trim()
    if (!searchValue) return safeOptions

    return safeOptions.filter((item) =>
      item.toLowerCase().includes(searchValue)
    )
  }, [safeOptions, search])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    onClose()
  }

  const handleAdd = () => {
    const trimmedValue = newValue.trim()
    if (!trimmedValue || !onAddNew) return

    onAddNew(trimmedValue)
    onChange(trimmedValue)
    onClose()
  }

  return (
    <div className="relative" ref={rootRef}>
      <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {label}
      </label>

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-left text-base text-[#142952] shadow-sm"
      >
        <span className={value ? 'text-[#142952]' : 'text-[#8C9AB3]'}>
          {value || placeholder}
        </span>

        <ChevronDown
          size={20}
          className={`text-[#8C9AB3] transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+8px)] ${zIndexClassName} overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white shadow-[0_12px_30px_rgba(20,41,82,0.10)]`}
        >
          {/* SEARCH */}
          <div className="border-b border-[#EEF3F8] p-3">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-3">
              <Search size={18} className="text-[#8C9AB3]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-[#142952] outline-none placeholder:text-[#8C9AB3]"
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const selected =
                  (value || '').toLowerCase() === item.toLowerCase()

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                      selected
                        ? 'bg-[#EEF4FF] text-[#2F66C8]'
                        : 'text-[#5E6E8C] hover:bg-[#F8FAFE]'
                    }`}
                  >
                    <span className="text-base font-medium">{item}</span>

                    {selected && (
                      <Check className="h-4 w-4 text-[#2F66C8]" />
                    )}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-sm text-[#8C9AB3]">
                {t('noResults')}
              </div>
            )}
          </div>

          {/* ADD NEW */}
          {onAddNew && (
            <div className="border-t border-[#EEF3F8] p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={addPlaceholder}
                  className="w-full rounded-2xl border border-[#E7EDF5] bg-white px-4 py-3 text-sm text-[#142952] outline-none placeholder:text-[#8C9AB3] focus:border-[#BCD1F3] focus:ring-2 focus:ring-[#EAF2FF]"
                />

                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded-2xl bg-[#2F66C8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2859B2]"
                >
                  {t('add')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}