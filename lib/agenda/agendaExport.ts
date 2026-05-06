import {
  getCategoryKey,
  getPestTargetKey,
  getPriorityKey,
  getStatusKey,
  getVisitTypeKey,
} from '@/lib/tasks/taskLabels'
import type { AgendaTask } from '@/components/agenda/AgendaTypes'
import {
  applyDataRowStyle,
  applyHeaderStyle,
  createStyledWorkbook,
  downloadWorkbook,
} from '@/lib/export/excelStyles'

type ExportMonthToExcelParams = {
  tasksForCurrentMonth: AgendaTask[]
  monthLabel: string
  locale: string
  t: (key: string) => string
}

export async function exportMonthToExcel({
  tasksForCurrentMonth,
  monthLabel,
  locale,
  t,
}: ExportMonthToExcelParams) {
  if (!tasksForCurrentMonth || tasksForCurrentMonth.length === 0) {
    alert(t('agendaExport.noTasks'))
    return
  }

  const workbook = createStyledWorkbook()
  const worksheet = workbook.addWorksheet(t('agendaExport.sheetName'), {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  worksheet.columns = [
    { header: t('agendaExport.columns.date'), key: 'date', width: 16 },
    { header: t('agendaExport.columns.time'), key: 'time', width: 12 },
    { header: t('agendaExport.columns.title'), key: 'title', width: 28 },
    { header: t('agendaExport.columns.description'), key: 'description', width: 40 },
    { header: t('agendaExport.columns.apartmentOrArea'), key: 'apartmentOrArea', width: 22 },
    { header: t('agendaExport.columns.category'), key: 'category', width: 18 },
    { header: t('agendaExport.columns.priority'), key: 'priority', width: 14 },
    { header: t('agendaExport.columns.status'), key: 'status', width: 16 },
    { header: t('agendaExport.columns.visitType'), key: 'visitType', width: 18 },
    { header: t('agendaExport.columns.pests'), key: 'pests', width: 24 },
  ]
  applyHeaderStyle(worksheet.getRow(1))

  tasksForCurrentMonth.forEach((task) => {
    const row = worksheet.addRow({
      date: new Intl.DateTimeFormat(locale).format(
        new Date(`${task.task_date}T12:00:00`)
      ),
      time: task.task_time ? task.task_time.slice(0, 5) : '',
      title: task.title,
      description: task.description || '',
      apartmentOrArea: task.apartment_or_area || '',
      category: t(`taskLabels.${getCategoryKey(task.category)}`),
      priority: t(`taskLabels.${getPriorityKey(task.priority)}`),
      status: t(`taskLabels.${getStatusKey(task.status)}`),
      visitType: task.treatment_visit_type
        ? t(`taskLabels.${getVisitTypeKey(task.treatment_visit_type)}`)
        : '',
      pests: Array.isArray(task.pest_targets)
        ? task.pest_targets
            .map((item) => t(`taskLabels.${getPestTargetKey(item)}`))
            .join(', ')
        : '',
    })
    applyDataRowStyle(row)
  })
  worksheet.autoFilter = 'A1:J1'

  const safeMonth = monthLabel.replace(/\s+/g, '_')
  await downloadWorkbook(workbook, `${t('agendaExport.filePrefix')}_${safeMonth}.xlsx`)
}
