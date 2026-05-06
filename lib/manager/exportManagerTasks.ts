'use client'

import { getPriorityKey, getStatusKey } from '@/lib/tasks/taskLabels'
import { getManagerTaskCategoryLabel } from '@/lib/manager/managerTaskCategories'
import {
  applyDataRowStyle,
  applyHeaderStyle,
  createStyledWorkbook,
  downloadWorkbook,
} from '@/lib/export/excelStyles'
import type { ManagerTask } from '@/lib/manager/managerTaskService'

type TranslateFn = (key: string) => string

type ExportManagerTasksToExcelParams = {
  tasks: ManagerTask[]
  buildingNameById: Record<string, string>
  locale: string
  t: TranslateFn
  fileScope?: string
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return ''

  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '')
}

function labelFromTaskKey(t: TranslateFn, key: string, fallback: string) {
  try {
    return t(key)
  } catch {
    return fallback
  }
}

export async function exportManagerTasksToExcel({
  tasks,
  buildingNameById,
  locale,
  t,
  fileScope = 'manager',
}: ExportManagerTasksToExcelParams) {
  if (!tasks.length) {
    alert('No hay tareas para exportar.')
    return
  }

  const workbook = createStyledWorkbook()
  const worksheet = workbook.addWorksheet('Tareas administrativas', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  worksheet.columns = [
    { header: 'Fecha', key: 'date', width: 16 },
    { header: 'Hora', key: 'time', width: 12 },
    { header: 'Titulo', key: 'title', width: 30 },
    { header: 'Descripcion', key: 'description', width: 40 },
    { header: 'Edificio', key: 'building', width: 24 },
    { header: 'Ubicacion', key: 'location', width: 22 },
    { header: 'Categoria', key: 'category', width: 18 },
    { header: 'Prioridad', key: 'priority', width: 14 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Completada el', key: 'completedAt', width: 22 },
    { header: 'Creada el', key: 'createdAt', width: 22 },
  ]
  applyHeaderStyle(worksheet.getRow(1))

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateCompare = a.task_date.localeCompare(b.task_date)
    if (dateCompare !== 0) return dateCompare

    const timeCompare = (a.task_time || '99:99').localeCompare(
      b.task_time || '99:99'
    )
    if (timeCompare !== 0) return timeCompare

    return a.title.localeCompare(b.title)
  })

  sortedTasks.forEach((task) => {
    const row = worksheet.addRow({
      date: formatDate(task.task_date, locale),
      time: task.task_time ? task.task_time.slice(0, 5) : '',
      title: task.title,
      description: task.description || '',
      building: task.building_id
        ? buildingNameById[task.building_id] || 'Edificio'
        : 'General',
      location: task.apartment_or_area || '',
      category: getManagerTaskCategoryLabel(task.category),
      priority: labelFromTaskKey(
        t,
        `taskLabels.${getPriorityKey(task.priority)}`,
        task.priority
      ),
      status: labelFromTaskKey(
        t,
        `taskLabels.${getStatusKey(task.status)}`,
        task.status
      ),
      completedAt: formatDateTime(task.completed_at, locale),
      createdAt: formatDateTime(task.created_at, locale),
    })
    applyDataRowStyle(row)
  })

  worksheet.autoFilter = 'A1:K1'

  const today = new Date().toISOString().slice(0, 10)
  const scope = sanitizeFileName(fileScope) || 'manager'

  await downloadWorkbook(workbook, `tareas_administrativas_${scope}_${today}.xlsx`)
}
