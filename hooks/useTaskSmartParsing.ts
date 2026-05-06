'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { parseSmartTaskInput } from '@/lib/tasks/taskSmartParser'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import type {
  PestTarget,
  TaskCategory,
  TaskPriority,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type UseTaskSmartParsingParams = {
  title: string
  setCategory: (value: TaskCategory | '') => void
  setPriority: (value: TaskPriority) => void
  setTaskDate: (value: string) => void
  setTaskTime: (value: string) => void
  setLocationValue: (value: string) => void
  setDraftApartmentVisitType: (value: TreatmentVisitType | '') => void
  setPestTargets: (
    value: PestTarget[] | ((prev: PestTarget[]) => PestTarget[])
  ) => void
  setSelectedApartments: (
    value:
      | TaskApartmentInput[]
      | ((prev: TaskApartmentInput[]) => TaskApartmentInput[])
  ) => void
}

type SmartParsedResult = ReturnType<typeof parseSmartTaskInput>

export function useTaskSmartParsing({
  title,
  setCategory,
  setPriority,
  setTaskDate,
  setTaskTime,
  setLocationValue,
  setDraftApartmentVisitType,
  setPestTargets,
  setSelectedApartments,
}: UseTaskSmartParsingParams) {
  const locale = useLocale()
  const smartParsed = useMemo(
    () => parseSmartTaskInput(title, locale),
    [locale, title]
  )

  const tryApplySmartParsing = (value: string): SmartParsedResult => {
    const parsed = parseSmartTaskInput(value, locale)

    if (parsed.detectedCategory) {
      setCategory(parsed.detectedCategory)
    }

    if (parsed.detectedPriority) {
      setPriority(parsed.detectedPriority)
    }

    if (parsed.detectedDate) {
      setTaskDate(parsed.detectedDate)
    }

    if (parsed.detectedTime) {
      setTaskTime(parsed.detectedTime)
    }

    if (parsed.detectedCategory === 'pest') {
      const detectedVisitType = parsed.detectedVisitType || 'nuevo'
      setDraftApartmentVisitType(detectedVisitType)

      if (
        Array.isArray(parsed.detectedPestTargets) &&
        parsed.detectedPestTargets.length > 0
      ) {
        setPestTargets(parsed.detectedPestTargets)
      }

      const parsedApartments = Array.isArray(parsed.detectedApartments)
        ? parsed.detectedApartments
        : []

      if (parsedApartments.length > 0) {
        setSelectedApartments(() => {
          const uniqueMap = new Map<string, TaskApartmentInput>()

          for (const apartment of parsedApartments) {
            const cleanApartment = apartment.trim()
            const apartmentKey = normalizeApartmentKey(cleanApartment)

            if (!cleanApartment || !apartmentKey) continue

            uniqueMap.set(apartmentKey, {
              apartment_or_area: cleanApartment,
              apartment_key: apartmentKey,
              visit_type: detectedVisitType,
            })
          }

          return Array.from(uniqueMap.values())
        })
      }
    } else if (parsed.detectedLocation) {
      setLocationValue(parsed.detectedLocation)
    }

    return parsed
  }

  return {
    smartParsed,
    tryApplySmartParsing,
  }
}
