'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { PestTarget, TaskCategory, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type UseTaskCategoryResetParams = {
  category: TaskCategory | ''
  setPestTargets: Dispatch<SetStateAction<PestTarget[]>>
  resetApartments: (items?: TaskApartmentInput[]) => void
  setDraftApartmentValue: Dispatch<SetStateAction<string>>
  setDraftApartmentVisitType: Dispatch<SetStateAction<TreatmentVisitType | ''>>
}

export function useTaskCategoryReset({
  category,
  setPestTargets,
  resetApartments,
  setDraftApartmentValue,
  setDraftApartmentVisitType,
}: UseTaskCategoryResetParams) {
  useEffect(() => {
    if (category === 'pest') return

    setPestTargets([])
    resetApartments([])
    setDraftApartmentValue('')
    setDraftApartmentVisitType('')
  }, [
    category,
    setPestTargets,
    resetApartments,
    setDraftApartmentValue,
    setDraftApartmentVisitType,
  ])
}
