'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { ArrowRightLeft, Check, ChevronDown, Search, X } from 'lucide-react'

type MergeCategoriesModalProps = {
  open: boolean
  categories?: string[]
  fromCategory: string
  toCategory: string
  message: string
  saving: boolean
  onClose: () => void
  onChangeFrom: (value: string) => void
  onChangeTo: (value: string) => void
  onConfirm: () => void
}

type DropdownProps = {
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  options: string[]
  selected: string
  onSelect: (value: string) => void
  emptyText: string
  searchPlaceholder: string
}

export default function MergeCategoriesModal({
  open,
  categories = [],
  fromCategory,
  toCategory,
  message,
  saving,
  onClose,
  onChangeFrom,
  onChangeTo,
  onConfirm,
}: MergeCategoriesModalProps) {
  const t = useTranslations('mergeCategoriesModal')

  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [fromSearch, setFromSearch] = useState('')
  const [toSearch, setToSearch] = useState('')

  const fromRef = useRef<HTMLDivElement | null>(null)
  const toRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    setFromOpen(false)
    setToOpen(false)
    setFromSearch('')
    setToSearch('')
  }, [open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setFromOpen(false)
      }

      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setToOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const safeFromCategory = fromCategory || ''
  const safeToCategory = toCategory || ''

  const fromOptions = useMemo(() => {
    return categories.filter((category) =>
      category.toLowerCase().includes(fromSearch.toLowerCase().trim())
    )
  }, [categories, fromSearch])

  const toOptions = useMemo(() => {
    return categories
      .filter(
        (category) =>
          category.toLowerCase() !== safeFromCategory.toLowerCase()
      )
      .filter((category) =>
        category.toLowerCase().includes(toSearch.toLowerCase().trim())
      )
  }, [categories, safeFromCategory, toSearch])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-center px-0 sm:px-0">
        <div className="mx-auto w-full overflow-visible rounded-t-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:rounded-[32px]">
          <div className="border-b border-[#E7EDF5] px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#142952]">
                {t('title')}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[#6E7F9D] transition hover:bg-[#F8FAFE]"
                aria-label={t('close')}
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="mb-5 rounded-2xl border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-4">
              <p className="text-sm font-semibold text-[#2F66C8]">
                {t('whatIsThis')}
              </p>
              <p className="mt-1 text-sm text-[#5E6E8C]">
                {t('description')}
              </p>
            </div>

            <div className="space-y-5">
              <div className="relative z-20" ref={fromRef}>
                <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
                  {t('fromCategory')}
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setFromOpen((prev) => !prev)
                    setToOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-left text-base text-[#142952] shadow-sm"
                >
                  <span
                    className={
                      safeFromCategory ? 'text-[#142952]' : 'text-[#8C9AB3]'
                    }
                  >
                    {safeFromCategory || t('selectCategory')}
                  </span>

                  <ChevronDown
                    size={20}
                    className={`text-[#8C9AB3] transition ${
                      fromOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {fromOpen && (
                  <Dropdown
                    search={fromSearch}
                    setSearch={setFromSearch}
                    options={fromOptions}
                    selected={safeFromCategory}
                    onSelect={(value) => {
                      onChangeFrom(value)

                      if (
                        safeToCategory.toLowerCase() === value.toLowerCase()
                      ) {
                        onChangeTo('')
                      }

                      setFromOpen(false)
                      setFromSearch('')
                    }}
                    emptyText={t('noResults')}
                    searchPlaceholder={t('search')}
                  />
                )}
              </div>

              <div className="flex justify-center text-[#8C9AB3]">
                <ArrowRightLeft size={22} />
              </div>

              <div className="relative z-10" ref={toRef}>
                <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
                  {t('toCategory')}
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setToOpen((prev) => !prev)
                    setFromOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-left text-base text-[#142952] shadow-sm"
                >
                  <span
                    className={
                      safeToCategory ? 'text-[#142952]' : 'text-[#8C9AB3]'
                    }
                  >
                    {safeToCategory || t('selectCategory')}
                  </span>

                  <ChevronDown
                    size={20}
                    className={`text-[#8C9AB3] transition ${
                      toOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {toOpen && (
                  <Dropdown
                    search={toSearch}
                    setSearch={setToSearch}
                    options={toOptions}
                    selected={safeToCategory}
                    onSelect={(value) => {
                      onChangeTo(value)
                      setToOpen(false)
                      setToSearch('')
                    }}
                    emptyText={t('noAvailable')}
                    searchPlaceholder={t('search')}
                  />
                )}
              </div>

              <div className="rounded-2xl bg-[#F9FBFE] px-4 py-4 text-sm text-[#5E6E8C]">
                {t('example')}
              </div>

              {message && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base font-semibold text-[#5E6E8C] transition hover:bg-[#F8FAFE]"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                className="flex-1 rounded-2xl bg-[#2F66C8] px-4 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(47,102,200,0.22)] transition hover:bg-[#2859B2] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? t('merging') : t('merge')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dropdown({
  search,
  setSearch,
  options,
  selected,
  onSelect,
  emptyText,
  searchPlaceholder,
}: DropdownProps) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white shadow-[0_12px_30px_rgba(20,41,82,0.10)]">
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

      <div className="max-h-56 overflow-y-auto">
        {options.length > 0 ? (
          options.map((option) => {
            const selectedOption =
              selected.toLowerCase() === option.toLowerCase()

            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  selectedOption
                    ? 'bg-[#EEF4FF] text-[#2F66C8]'
                    : 'text-[#5E6E8C] hover:bg-[#F8FAFE]'
                }`}
              >
                <span className="text-base font-medium">{option}</span>

                {selectedOption && (
                  <Check className="h-4 w-4 text-[#2F66C8]" />
                )}
              </button>
            )
          })
        ) : (
          <div className="px-4 py-3 text-sm text-[#8C9AB3]">{emptyText}</div>
        )}
      </div>
    </div>
  )
}