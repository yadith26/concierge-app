'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import {
  findActiveWarrantyForApartmentAndPest,
  type PestTarget as WarrantyPestTarget,
} from '@/lib/tasks/warrantyHelpers'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

export type PestTreatmentHistoryRow = {
  apartment_or_area: string
  apartment_key?: string | null
  pest_target: PestTarget | null
  treatment_visit_type: TreatmentVisitType | null
  treatment_date: string
}

export type WarrantyAlertItem = {
  apartment_or_area: string
  pestTarget: PestTarget
  endDate: string
}

type UseTaskWarrantyParams = {
  open: boolean
  buildingId: string
  category: string
  selectedApartments: TaskApartmentInput[]
  pestTargets: PestTarget[]
}

export function useTaskWarranty({
  open,
  buildingId,
  category,
  selectedApartments,
  pestTargets,
}: UseTaskWarrantyParams) {
  const [warrantyLoading, setWarrantyLoading] = useState(false)
  const [warrantyHistory, setWarrantyHistory] = useState<
    PestTreatmentHistoryRow[]
  >([])

  useEffect(() => {
    const fetchWarrantyHistory = async () => {
      if (!open || !buildingId || category !== 'pest') {
        setWarrantyHistory([])
        return
      }

      const apartmentValues = selectedApartments
        .map((item) => item.apartment_or_area.trim())
        .filter(Boolean)

      if (apartmentValues.length === 0 || pestTargets.length === 0) {
        setWarrantyHistory([])
        return
      }

      setWarrantyLoading(true)

      try {
        const orConditions = apartmentValues
          .flatMap((value) => {
            const key = normalizeApartmentKey(value)
            return [`apartment_key.eq.${key}`, `apartment_or_area.eq.${value}`]
          })
          .join(',')

        const { data, error } = await supabase
          .from('pest_treatments')
          .select(
            'apartment_or_area, apartment_key, pest_target, treatment_visit_type, treatment_date'
          )
          .eq('building_id', buildingId)
          .or(orConditions)

        if (error) {
          console.error('Error cargando garantías:', error)
          setWarrantyHistory([])
          return
        }

        const rows = ((data as PestTreatmentHistoryRow[]) || []).filter(
          (item) => !!item.pest_target
        )

        setWarrantyHistory(rows)
      } finally {
        setWarrantyLoading(false)
      }
    }

    void fetchWarrantyHistory()
  }, [open, buildingId, category, selectedApartments, pestTargets])

  const warrantyAlerts = useMemo<WarrantyAlertItem[]>(() => {
    if (
      category !== 'pest' ||
      selectedApartments.length === 0 ||
      pestTargets.length === 0
    ) {
      return []
    }

    const alerts: WarrantyAlertItem[] = []

    for (const apartment of selectedApartments) {
      const apartmentRef = {
        apartment_or_area: apartment.apartment_or_area,
        apartment_key:
          apartment.apartment_key ??
          normalizeApartmentKey(apartment.apartment_or_area),
      }

      for (const pestTarget of pestTargets) {
        const warranty = findActiveWarrantyForApartmentAndPest(
          warrantyHistory,
          apartmentRef,
          pestTarget as WarrantyPestTarget
        )

        if (warranty?.isActive) {
          alerts.push({
            apartment_or_area: apartment.apartment_or_area,
            pestTarget,
            endDate: warranty.endDate,
          })
        }
      }
    }

    return alerts
  }, [category, selectedApartments, pestTargets, warrantyHistory])

  return {
    warrantyLoading,
    warrantyHistory,
    warrantyAlerts,
  }
}