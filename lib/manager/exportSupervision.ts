'use client'

import {
  applyDataRowStyle,
  applyHeaderStyle,
  createStyledWorkbook,
  downloadWorkbook,
} from '@/lib/export/excelStyles'
import type { BuildingSupervisionSummary } from '@/lib/manager/supervisionService'

type ExportSupervisionToExcelParams = {
  summaries: BuildingSupervisionSummary[]
  locale: string
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

function formatTreatment(
  summary: BuildingSupervisionSummary,
  locale: string
) {
  const treatment = summary.latestTreatment
  if (!treatment) return ''

  const pest =
    treatment.pest_target === 'cucarachas'
      ? 'Cucarachas'
      : treatment.pest_target === 'roedores'
        ? 'Roedores'
        : treatment.pest_target === 'chinches'
          ? 'Chinches'
          : 'Plagas'

  return `${treatment.apartment_or_area} · ${pest} · ${formatDate(
    treatment.treatment_date,
    locale
  )}`
}

export async function exportSupervisionToExcel({
  locale,
  summaries,
}: ExportSupervisionToExcelParams) {
  if (!summaries.length) {
    alert('No hay datos de supervision para exportar.')
    return
  }

  const workbook = createStyledWorkbook()
  const summarySheet = workbook.addWorksheet('Supervision', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  summarySheet.columns = [
    { header: 'Edificio', key: 'building', width: 26 },
    { header: 'Direccion', key: 'address', width: 34 },
    { header: '% completado', key: 'completionRate', width: 14 },
    { header: 'Tareas mes', key: 'totalMonthTasks', width: 12 },
    { header: 'Completadas', key: 'completedMonthTasks', width: 12 },
    { header: 'Atrasadas', key: 'overdueTasks', width: 12 },
    { header: 'Hoy', key: 'todayTasks', width: 10 },
    { header: 'Ultimo tratamiento', key: 'latestTreatment', width: 42 },
    { header: 'Alertas', key: 'alerts', width: 12 },
  ]
  applyHeaderStyle(summarySheet.getRow(1))

  summaries.forEach((summary) => {
    const row = summarySheet.addRow({
      building: summary.building.name,
      address: summary.building.address || '',
      completionRate: `${summary.completionRate}%`,
      totalMonthTasks: summary.totalMonthTasks,
      completedMonthTasks: summary.completedMonthTasks,
      overdueTasks: summary.overdueTasks,
      todayTasks: summary.todayTasks,
      latestTreatment: formatTreatment(summary, locale),
      alerts: summary.alerts.length,
    })
    applyDataRowStyle(row)
  })
  summarySheet.autoFilter = 'A1:I1'

  const alertsSheet = workbook.addWorksheet('Alertas', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  alertsSheet.columns = [
    { header: 'Edificio', key: 'building', width: 26 },
    { header: 'Unidad', key: 'unit', width: 20 },
    { header: 'Tratamientos recientes', key: 'count', width: 22 },
    { header: 'Ultima fecha', key: 'latestDate', width: 18 },
  ]
  applyHeaderStyle(alertsSheet.getRow(1))

  const alertRows = summaries.flatMap((summary) =>
    summary.alerts.map((alert) => ({
      building: summary.building.name,
      unit: alert.apartmentOrArea,
      count: alert.count,
      latestDate: formatDate(alert.latestDate, locale),
    }))
  )

  if (alertRows.length > 0) {
    alertRows.forEach((item) => {
      const row = alertsSheet.addRow(item)
      applyDataRowStyle(row)
    })
  } else {
    const row = alertsSheet.addRow({
      building: 'Sin alertas',
    })
    applyDataRowStyle(row)
  }
  alertsSheet.autoFilter = 'A1:D1'

  const today = new Date().toISOString().slice(0, 10)
  await downloadWorkbook(workbook, `supervision_${today}.xlsx`)
}
