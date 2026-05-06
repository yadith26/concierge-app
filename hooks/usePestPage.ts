'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { resolveConciergeBuildingContext } from '@/lib/buildings/conciergeBuildingContext'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'
import { TASK_SELECT_FIELDS, normalizeTask } from '@/lib/tasks/taskHelpers'
import { updateTaskStatusWithTreatment } from '@/lib/tasks/taskStatusActions'
import { exportTreatmentHistoryToExcel } from '@/lib/tasks/exportTreatmentHistory'
import type { EditableTask } from '@/lib/tasks/taskTypes'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'

export function usePestPage(selectedBuildingId?: string | null) {
  const locale = useLocale()
  const t = useTranslations()

  const [tasks, setTasks] = useState<EditableTask[]>([])
  const [treatments, setTreatments] = useState<PestTreatmentRow[]>([])
  const [buildingName, setBuildingName] = useState('')
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [buildingId, setBuildingId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchTreatmentsData = useCallback(async () => {
    setLoading(true)

    const { profileId, buildings, building } =
      await resolveConciergeBuildingContext(selectedBuildingId)

    setProfileId(profileId)
    setBuildings(buildings)

    if (!building) {
      console.error('Error obteniendo edificio: sin edificio asignado')
      setTasks([])
      setTreatments([])
      setBuildings([])
      setLoading(false)
      return
    }

    setBuildingId(building.id)
    setBuildingName(building.name)

    const [
      { data: tasksData, error: tasksError },
      { data: historyData, error: historyError },
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select(TASK_SELECT_FIELDS)
        .eq('building_id', building.id)
        .eq('category', 'pest'),
      supabase
        .from('pest_treatments')
        .select('*')
        .eq('building_id', building.id)
        .order('treatment_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (tasksError) {
      console.error('Error obteniendo tareas de tratamiento:', tasksError)
      setTasks([])
    } else {
      setTasks(((tasksData as EditableTask[]) || []).map(normalizeTask))
    }

    if (historyError) {
      console.error('Error obteniendo historial de tratamientos:', historyError)
      setTreatments([])
    } else {
      setTreatments((historyData as PestTreatmentRow[]) || [])
    }

    setLoading(false)
  }, [selectedBuildingId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTreatmentsData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchTreatmentsData])

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      status: 'pending' | 'in_progress' | 'completed'
    ) => {
      const previousTasks = tasks
      const currentTask = tasks.find((task) => task.id === taskId)

      if (!currentTask) return

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      )

      try {
        await updateTaskStatusWithTreatment({
          task: currentTask,
          nextStatus: status,
          buildingId,
          profileId,
        })

        await fetchTreatmentsData()
      } catch (error) {
        console.error('Error actualizando estado:', error)

        if (error instanceof Error) {
          alert(error.message)
        } else {
          alert('Ocurrió un error actualizando el estado')
        }

        setTasks(previousTasks)
      }
    },
    [tasks, buildingId, profileId, fetchTreatmentsData]
  )

  const deleteScheduledTask = useCallback(
    async (taskId: string) => {
      const previousTasks = tasks

      setTasks((prev) => prev.filter((task) => task.id !== taskId))

      const { error } = await supabase.from('tasks').delete().eq('id', taskId)

      if (error) {
        console.error('Error eliminando tarea:', error)
        setTasks(previousTasks)
        return
      }

      await fetchTreatmentsData()
    },
    [tasks, fetchTreatmentsData]
  )

  const deleteHistoryRecord = useCallback(
    async (id: string) => {
      const previousTreatments = treatments

      setTreatments((prev) => prev.filter((item) => item.id !== id))

      const { error } = await supabase
        .from('pest_treatments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando registro:', error)
        setTreatments(previousTreatments)
        return
      }

      await fetchTreatmentsData()
    },
    [treatments, fetchTreatmentsData]
  )

  const exportHistoryToExcel = useCallback(
    (rows?: PestTreatmentRow[]) => {
      const dataToExport = rows ?? treatments

      exportTreatmentHistoryToExcel({
        treatments: dataToExport,
        buildingName,
        locale,
        t,
      })
    },
    [treatments, buildingName, locale, t]
  )

  return {
    tasks,
    treatments,
    buildingName,
    buildings,
    buildingId,
    profileId,
    loading,
    fetchTreatmentsData,
    updateTaskStatus,
    deleteScheduledTask,
    deleteHistoryRecord,
    exportHistoryToExcel,
  }
}
