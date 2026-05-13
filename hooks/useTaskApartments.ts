'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import type { TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type UseTaskApartmentsParams = {
  initialApartments?: TaskApartmentInput[]
  initialDraftApartmentValue?: string
  initialDraftApartmentVisitType?: TreatmentVisitType | ''
}

export function useTaskApartments({
  initialApartments = [],
  initialDraftApartmentValue = '',
  initialDraftApartmentVisitType = '',
}: UseTaskApartmentsParams = {}) {
  const t = useTranslations('taskApartments')
  const [selectedApartments, setSelectedApartments] =
    useState<TaskApartmentInput[]>(initialApartments)
  const [draftApartmentValue, setDraftApartmentValue] = useState(
    initialDraftApartmentValue
  )
  const [draftApartmentVisitType, setDraftApartmentVisitType] = useState<
    TreatmentVisitType | ''
  >(initialDraftApartmentVisitType)

  const finalDraftApartment = useMemo(
    () => draftApartmentValue.trim(),
    [draftApartmentValue]
  )

  const sanitizeApartmentValue = useCallback((value: string) => {
    return value.replace(/,/g, '').replace(/\s{2,}/g, ' ')
  }, [])

  const resetApartments = useCallback((apartments: TaskApartmentInput[] = []) => {
    setSelectedApartments(apartments)
    setDraftApartmentValue('')
    setDraftApartmentVisitType('')
  }, [])

  const handleAddApartment = useCallback((): { ok: boolean; message?: string } => {
    if (!finalDraftApartment) {
      return {
        ok: false,
        message: t('missingApartment'),
      }
    }

    if (finalDraftApartment.includes(',')) {
      return {
        ok: false,
        message: t('multipleApartmentsNotAllowed'),
      }
    }

    if (!draftApartmentVisitType) {
      return {
        ok: false,
        message: t('missingVisitType'),
      }
    }

    const apartmentKey = normalizeApartmentKey(finalDraftApartment)

    const alreadyExists = selectedApartments.some(
      (item) => item.apartment_key === apartmentKey
    )

    if (alreadyExists) {
      return {
        ok: false,
        message: t('alreadyAdded'),
      }
    }

    setSelectedApartments((prev) => [
      ...prev,
      {
        apartment_or_area: finalDraftApartment,
        apartment_key: apartmentKey,
        visit_type: draftApartmentVisitType,
      },
    ])

    setDraftApartmentValue('')
    setDraftApartmentVisitType('')

    return { ok: true }
  }, [draftApartmentVisitType, finalDraftApartment, selectedApartments, t])

  const handleRemoveApartment = useCallback((index: number) => {
    setSelectedApartments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return {
    selectedApartments,
    setSelectedApartments,
    draftApartmentValue,
    setDraftApartmentValue,
    draftApartmentVisitType,
    setDraftApartmentVisitType,
    finalDraftApartment,
    sanitizeApartmentValue,
    resetApartments,
    handleAddApartment,
    handleRemoveApartment,
  }
}
