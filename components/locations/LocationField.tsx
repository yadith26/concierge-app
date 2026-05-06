'use client'

import { Building2, ChevronDown, MapPin } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  return /^(?:apto|apt|apartment|apartamento)\s*[a-z]?\d+[a-z0-9-]*$/i.test(clean)
    || /^[a-z]*\d+[a-z0-9-]*$/i.test(clean)
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

  const locationOptions = [
    { value: 'apartment', label: t('options.apartment'), needsDetail: true, placeholder: t('placeholderApartment') },
    { value: 'lobby', label: t('options.lobby') },
    { value: 'garage', label: t('options.garage') },
    { value: 'hallway', label: t('options.hallway') },
    { value: 'stairs', label: t('options.stairs') },
    { value: 'elevator', label: t('options.elevator') },
    { value: 'terrace', label: t('options.terrace') },
    { value: 'basement', label: t('options.basement') },
    { value: 'laundry', label: t('options.laundry') },
    { value: 'other', label: t('options.other'), needsDetail: true, placeholder: t('placeholderOther') },
  ]

  const parsedInitial = useMemo(() => parseExistingValue(value), [value])

  const [locationType, setLocationType] = useState<LocationType>(parsedInitial.locationType)
  const [locationDetail, setLocationDetail] = useState(parsedInitial.locationDetail)
  const [open, setOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLocationType(parsedInitial.locationType)
    setLocationDetail(parsedInitial.locationDetail)
  }, [parsedInitial.locationType, parsedInitial.locationDetail])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const lastSentValueRef = useRef('')

  function buildFormattedLocation(type: LocationType, detail: string) {
    const d = detail.trim()

    if (type === 'apartment') {
      return d ? `${t('apartmentPrefix')} ${d.toUpperCase()}` : ''
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
      other: d,
    }

    return map[type]
  }

  useEffect(() => {
    const formattedValue = buildFormattedLocation(locationType, locationDetail)

    if (formattedValue === value) {
      lastSentValueRef.current = formattedValue
      return
    }

    if (formattedValue === lastSentValueRef.current) return

    lastSentValueRef.current = formattedValue

    onChange({
      locationType,
      locationDetail,
      formattedValue,
    })
  }, [locationType, locationDetail, value])

  const selectedOption = locationOptions.find(o => o.value === locationType)!

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {label || t('label')}
      </label>

      <div className="space-y-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952]"
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-[#60739A]" />
              {selectedOption.label}
            </span>

            <ChevronDown size={20} className={`transition ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border bg-white shadow">
              {locationOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLocationType(option.value as LocationType)
                    if (!option.needsDetail) setLocationDetail('')
                    setOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#F8FAFE]"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedOption.needsDetail && (
          <div className="relative">
            <input
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder={selectedOption.placeholder || t('placeholderDefault')}
              className="w-full rounded-2xl border px-4 py-4 pl-11"
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" />
          </div>
        )}

        {!!buildFormattedLocation(locationType, locationDetail) && (
          <div className="rounded-2xl border bg-[#F7FAFF] px-4 py-3">
            <p className="text-xs text-[#8C9AB3]">{t('preview')}</p>
            <p className="text-sm font-semibold">
              {buildFormattedLocation(locationType, locationDetail)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
