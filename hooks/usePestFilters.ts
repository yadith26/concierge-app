'use client'

import { useMemo } from 'react'
import {
  buildGroupedTreatments,
  compareApartmentLabels,
} from '@/lib/tasks/pestHistoryHelpers'
import type {
  EditableTask,
  PestTarget,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'

type UsePestFiltersParams = {
  tasks: EditableTask[]
  treatments: PestTreatmentRow[]
  search: string
  pestFilter: 'all' | PestTarget
  visitFilter: 'all' | TreatmentVisitType
}

export function usePestFilters({
  tasks,
  treatments,
  search,
  pestFilter,
  visitFilter,
}: UsePestFiltersParams) {
  const scheduledTasks = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return tasks
      .filter(
        (task) => task.status === 'pending' || task.status === 'in_progress'
      )
      .filter((task) => {
        const taskTargets = Array.isArray(task.pest_targets)
          ? task.pest_targets
          : []

        const matchesSearch =
          !searchValue ||
          task.title.toLowerCase().includes(searchValue) ||
          (task.apartment_or_area || '').toLowerCase().includes(searchValue) ||
          (task.description || '').toLowerCase().includes(searchValue)

        const matchesPest =
          pestFilter === 'all' ? true : taskTargets.includes(pestFilter)

        const matchesVisit =
          visitFilter === 'all'
            ? true
            : task.treatment_visit_type === visitFilter ||
              (Array.isArray(task.task_apartments) &&
                task.task_apartments.some(
                  (item) => item.visit_type === visitFilter
                ))

        return matchesSearch && matchesPest && matchesVisit
      })
      .sort((a, b) =>
        compareApartmentLabels(a.apartment_or_area, b.apartment_or_area)
      )
  }, [tasks, search, pestFilter, visitFilter])

  const filteredTreatments = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return treatments.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.apartment_or_area.toLowerCase().includes(searchValue) ||
        (item.notes || '').toLowerCase().includes(searchValue)

      const matchesPest =
        pestFilter === 'all' ? true : item.pest_target === pestFilter

      const matchesVisit =
        visitFilter === 'all'
          ? true
          : item.treatment_visit_type === visitFilter

      return matchesSearch && matchesPest && matchesVisit
    })
  }, [treatments, search, pestFilter, visitFilter])

  const groupedTreatments = useMemo(() => {
    return buildGroupedTreatments(filteredTreatments)
  }, [filteredTreatments])

  return {
    scheduledTasks,
    filteredTreatments,
    groupedTreatments,
  }
}