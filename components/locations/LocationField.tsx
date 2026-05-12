'use client'

import { Building2, ChevronDown, MapPin } from 'lucide-react'
import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export type LocationType =
  | 'apartment'
  | 'lobby'
  | 'garage'
  | 'hallway'
  | 'stairs'
  | 'elevator'
  | 'terrace'
  | 'basement'
  | 'laundry'
  | 'other'

type LocationValue = {
  locationType: LocationType
  locationDetail: string
  formattedValue: string
}

type LocationFieldProps = {
  value: string
  onChange: (next: LocationValue) => void
  label?: string
}

function looksLikeApartmentValue(value: string) {
  const clean = value.trim()
  if (!clean) return false

  return (
    /^(?:apto|apt|apartment|apartamento)\s*[a-z]?\d+[a-z0-9-]*$/i.test(clean) ||
    /^[a-z]*\d+[a-z0-9-]*$/i.test(clean)
  )
}

function getCommonAreaType(value: string): LocationType | null {
  const clean = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (!clean) return null
  if (clean === 'lobby') return 'lobby'
  if (clean === 'garage' || clean === 'garaje') return 'garage'
  if (clean === 'hallway' || clean === 'pasillo') return 'hallway'
  if (clean === 'stairs' || clean === 'escalera') return 'stairs'
  if (clean === 'elevator' || clean === 'ascensor') return 'elevator'
  if (clean === 'terrace' || clean === 'terraza') return 'terrace'
  if (clean === 'basement' || clean === 'sotano') return 'basement'
  if (clean === 'laundry' || clean === 'lavanderia') return 'laundry'

  return null
}

function parseExistingValue(value: string): {
  locationType: LocationType
  locationDetail: string
} {
  const clean = value.trim()

  if (!clean) {
    return { locationType: 'apartment', locationDetail: '' }
  }

  if (looksLikeApartmentValue(clean)) {
    return {
      locationType: 'apartment',
      locationDetail: clean.replace(/^(?:apto|apt|apartment|apartamento)\s*/i, ''),
    }
  }

  const commonAreaType = getCommonAreaType(clean)
  if (commonAreaType) {
    return { locationType: commonAreaType, locationDetail: '' }
  }

  return { locationType: 'other', locationDetail: clean }
}

export default function LocationField({
  value,
  onChange,
  label,
}: LocationFieldProps) {
  const t = useTranslations('locationField')
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const locationOptions = useMemo(
    () => [
      {
        value: 'apartment',
        label: t('options.apartment'),
        needsDetail: true,
        placeholder: t('placeholderApartment'),
      },
      { value: 'lobby', label: t('options.lobby') },
      { value: 'garage', label: t('options.garage') },
      { value: 'hallway', label: t('options.hallway') },
      { value: 'stairs', label: t('options.stairs') },
      { value: 'elevator', label: t('options.elevator') },
      { value: 'terrace', label: t('options.terrace') },
      { value: 'basement', label: t('options.basement') },
      { value: 'laundry', label: t('options.laundry') },
      {
        value: 'other',
        label: t('options.other'),
        needsDetail: true,
        placeholder: t('placeholderOther'),
      },
    ],
    [t]
  )

  const parsedValue = useMemo(() => parseExistingValue(value), [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const buildFormattedLocation = useCallback(
    (type: LocationType, detail: string): string => {
      const trimmedDetail = detail.trim()

      if (type === 'apartment') {
        return trimmedDetail ? `${t('apartmentPrefix')} ${trimmedDetail.toUpperCase()}` : ''
      }

      const map: Record<LocationType, string> = {
        apartment: '',
        lobby: t('options.lobby'),
        garage: t('options.garage'),
        hallway: t('options.hallway'),
        stairs: t('options.stairs'),
        elevator: t('options.elevator'),
        terrace: t('options.terrace'),
        basement: t('options.basement'),
        laundry: t('options.laundry'),
        other: trimmedDetail,
      }

      return map[type]
    },
    [t]
  )

  const selectedOption = locationOptions.find(
    (option) => option.value === parsedValue.locationType
  )!

  const emitChange = useCallback(
    (locationType: LocationType, locationDetail: string) => {
      onChange({
        locationType,
        locationDetail,
        formattedValue: buildFormattedLocation(locationType, locationDetail),
      })
    },
    [buildFormattedLocation, onChange]
  )

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {label || t('label')}
      </label>

      <div className="space-y-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952]"
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-[#60739A]" />
              {selectedOption.label}
            </span>

            <ChevronDown
              size={20}
              className={`transition ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border bg-white shadow">
              {locationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const nextType = option.value as LocationType
                    setOpen(false)
                    emitChange(nextType, '')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#F8FAFE]"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedOption.needsDetail ? (
          <div className="relative">
            <input
              value={parsedValue.locationDetail}
              onChange={(event) => {
                emitChange(parsedValue.locationType, event.target.value)
              }}
              placeholder={selectedOption.placeholder || t('placeholderDefault')}
              className="w-full rounded-2xl border px-4 py-4 pl-11"
            />
            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
          </div>
        ) : null}

        {!!buildFormattedLocation(
          parsedValue.locationType,
          parsedValue.locationDetail
        ) ? (
          <div className="rounded-2xl border bg-[#F7FAFF] px-4 py-3">
            <p className="text-xs text-[#8C9AB3]">{t('preview')}</p>
            <p className="text-sm font-semibold">
              {buildFormattedLocation(
                parsedValue.locationType,
                parsedValue.locationDetail
              )}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
