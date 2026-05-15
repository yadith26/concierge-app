import ExcelJS from 'exceljs'
import {saveAs} from 'file-saver'
import {getPestTargetKey, getVisitTypeKey} from '@/lib/tasks/taskLabels'

export type PestTarget = 'cucarachas' | 'roedores' | 'chinches'
export type VisitType = 'nuevo' | 'seguimiento' | 'preventivo'

export type ExportTreatmentRow = {
  id: string
  apartment_or_area: string
  apartment_key?: string | null
  pest_target: PestTarget | null
  treatment_visit_type: VisitType | null
  treatment_date: string
  notes: string | null
  created_at: string
}

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string

type ApartmentSummary = {
  apartment: string
  cockroaches: number
  rodents: number
  bedbugs: number
  total: number
  firstDate: string | null
  lastDate: string | null
  notes: string[]
  latestPest: string
  latestVisitType: string
  activeWarranty: boolean
  activeWarrantyUntil: string | null
  status: string
}

const COLORS = {
  green: '145C43',
  greenDark: '0F4A35',
  greenLight: 'EAF4EE',
  blue: '2F66C8',
  blueLight: 'EEF4FF',
  red: 'D64555',
  redLight: 'FFF1F3',
  amber: 'E88A00',
  amberLight: 'FFF7E6',
  text: '142952',
  border: 'D9E2EC',
  white: 'FFFFFF',
}

function safeT(
  t: TranslateFn,
  key: string,
  fallback: string,
  values?: Record<string, string | number | Date>
) {
  const maybeHas = (t as TranslateFn & {has?: (key: string) => boolean}).has
  if (typeof maybeHas === 'function' && !maybeHas(key)) {
    return fallback
  }

  try {
    return t(key, values)
  } catch {
    return fallback
  }
}

function safeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function formatDateExport(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatYesNo(value: boolean, t: TranslateFn) {
  return value ? t('common.yes') : t('common.no')
}

function addOneYear(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  const next = new Date(year, (month || 1) - 1, day || 1)
  next.setFullYear(next.getFullYear() + 1)
  return next.toISOString().slice(0, 10)
}

function isWarrantySource(type: VisitType | null) {
  return type === 'nuevo' || type === 'preventivo'
}

function isWarrantyActive(endDate: string) {
  return new Date(`${endDate}T23:59:59`).getTime() >= Date.now()
}

function applySheetDefaults(sheet: ExcelJS.Worksheet) {
  sheet.views = [{showGridLines: false}]
  sheet.properties.defaultRowHeight = 22
  sheet.columns?.forEach((column) => {
    column.alignment = {vertical: 'middle'}
  })
}

function setCell(
  sheet: ExcelJS.Worksheet,
  cell: string,
  value: string | number,
  options?: {
    bold?: boolean
    size?: number
    color?: string
    align?: 'left' | 'center' | 'right'
  }
) {
  const current = sheet.getCell(cell)
  current.value = value
  current.font = {
    name: 'Aptos',
    size: options?.size ?? 11,
    bold: options?.bold ?? false,
    color: {argb: options?.color ?? COLORS.text},
  }
  current.alignment = {
    vertical: 'middle',
    horizontal: options?.align ?? 'left',
    wrapText: true,
  }
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: {argb: COLORS.white},
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {argb: COLORS.greenDark},
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    }
    cell.border = {
      top: {style: 'thin', color: {argb: COLORS.greenDark}},
      left: {style: 'thin', color: {argb: COLORS.greenDark}},
      bottom: {style: 'thin', color: {argb: COLORS.greenDark}},
      right: {style: 'thin', color: {argb: COLORS.greenDark}},
    }
  })
}

function styleTableBody(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)

    row.eachCell((cell) => {
      cell.font = {
        name: 'Aptos',
        size: 10,
        color: {argb: COLORS.text},
      }
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      }
      cell.border = {
        top: {style: 'thin', color: {argb: COLORS.border}},
        left: {style: 'thin', color: {argb: COLORS.border}},
        bottom: {style: 'thin', color: {argb: COLORS.border}},
        right: {style: 'thin', color: {argb: COLORS.border}},
      }
    })

    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {argb: 'FAFCFF'},
        }
      })
    }
  }
}

function addSectionTitle(sheet: ExcelJS.Worksheet, row: number, title: string) {
  sheet.mergeCells(`B${row}:N${row}`)
  setCell(sheet, `B${row}`, title, {
    bold: true,
    size: 13,
    color: COLORS.greenDark,
  })
}

function addMetricCard(
  sheet: ExcelJS.Worksheet,
  range: string,
  title: string,
  value: string | number,
  subtitle1: string,
  subtitle2: string,
  color: string,
  bg: string
) {
  sheet.mergeCells(range)
  const [start] = range.split(':')
  const cell = sheet.getCell(start)
  cell.value = {
    richText: [
      {
        text: `${title}\n`,
        font: {bold: true, size: 10, color: {argb: color}, name: 'Aptos'},
      },
      {
        text: `${value}\n`,
        font: {bold: true, size: 20, color: {argb: color}, name: 'Aptos'},
      },
      {
        text: `${subtitle1}\n${subtitle2}`,
        font: {size: 10, color: {argb: COLORS.text}, name: 'Aptos'},
      },
    ],
  }
  cell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
  }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb: bg},
  }
  cell.border = {
    top: {style: 'thin', color: {argb: COLORS.border}},
    left: {style: 'thin', color: {argb: COLORS.border}},
    bottom: {style: 'thin', color: {argb: COLORS.border}},
    right: {style: 'thin', color: {argb: COLORS.border}},
  }
}

function styleTitle(
  sheet: ExcelJS.Worksheet,
  buildingName: string,
  locale: string,
  t: TranslateFn
) {
  sheet.mergeCells('B2:C3')
  setCell(sheet, 'B2', 'CONCIERGE\nAPP', {
    bold: true,
    size: 18,
    color: COLORS.green,
    align: 'center',
  })

  sheet.mergeCells('D2:J2')
  setCell(
    sheet,
    'D2',
    safeT(t, 'treatmentExport.reportTitle', 'TREATMENT REPORT'),
    {
      bold: true,
      size: 18,
      color: COLORS.greenDark,
    }
  )

  sheet.mergeCells('D3:J3')
  setCell(
    sheet,
    'D3',
    safeT(
      t,
      'treatmentExport.reportSubtitle',
      `Treatment summary for building ${buildingName}`,
      {buildingName}
    ),
    {size: 11, color: COLORS.text}
  )

  setCell(sheet, 'K2', safeT(t, 'treatmentExport.generatedOn', 'Generated on:'), {
    size: 11,
    color: COLORS.text,
  })
  setCell(sheet, 'L2', formatDateExport(new Date().toISOString().slice(0, 10), locale), {
    size: 11,
    color: COLORS.text,
  })
  setCell(sheet, 'K3', safeT(t, 'treatmentExport.building', 'Building:'), {
    size: 11,
    color: COLORS.text,
  })
  setCell(
    sheet,
    'L3',
    buildingName || safeT(t, 'treatmentExport.noBuilding', 'No building'),
    {size: 11, color: COLORS.text}
  )
  setCell(sheet, 'K4', safeT(t, 'treatmentExport.generatedBy', 'Generated by:'), {
    size: 11,
    color: COLORS.text,
  })
  setCell(sheet, 'L4', safeT(t, 'treatmentExport.concierge', 'Concierge'), {
    size: 11,
    color: COLORS.text,
  })
}

function createDetailSheet(
  workbook: ExcelJS.Workbook,
  rows: ExportTreatmentRow[],
  locale: string,
  t: TranslateFn
) {
  const sheet = workbook.addWorksheet(
    safeT(t, 'treatmentExport.detailSheetName', 'Treatment details')
  )
  sheet.columns = [
    {width: 22},
    {width: 14},
    {width: 18},
    {width: 16},
    {width: 36},
    {width: 20},
  ]
  applySheetDefaults(sheet)

  sheet.getRow(1).values = [
    safeT(t, 'treatmentExport.columns.apartment', 'Apartment'),
    safeT(t, 'treatmentExport.columns.treatmentDate', 'Treatment date'),
    safeT(t, 'treatmentExport.columns.latestPest', 'Pest'),
    safeT(t, 'treatmentExport.columns.latestVisit', 'Visit type'),
    safeT(t, 'treatmentExport.columns.notes', 'Notes'),
    safeT(t, 'treatmentExport.columns.createdAt', 'Created at'),
  ]
  styleHeader(sheet.getRow(1))

  rows.forEach((item, index) => {
    sheet.getRow(index + 2).values = [
      item.apartment_or_area,
      formatDateExport(item.treatment_date, locale),
      item.pest_target ? t(`taskLabels.${getPestTargetKey(item.pest_target)}`) : '',
      item.treatment_visit_type
        ? t(`taskLabels.${getVisitTypeKey(item.treatment_visit_type)}`)
        : '',
      item.notes || '',
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(item.created_at)),
    ]
  })

  if (rows.length > 0) {
    styleTableBody(sheet, 2, rows.length + 1)
  }
  sheet.autoFilter = {
    from: 'A1',
    to: `F${rows.length + 1}`,
  }
}

export async function exportTreatmentHistoryToExcel({
  treatments,
  buildingName,
  locale,
  t,
}: {
  treatments: ExportTreatmentRow[]
  buildingName: string
  locale: string
  t: TranslateFn
}) {
  if (!treatments.length) return

  const grouped = new Map<string, ApartmentSummary>()

  for (const item of treatments) {
    const key = item.apartment_key || item.apartment_or_area

    if (!grouped.has(key)) {
      grouped.set(key, {
        apartment: item.apartment_or_area,
        cockroaches: 0,
        rodents: 0,
        bedbugs: 0,
        total: 0,
        firstDate: item.treatment_date,
        lastDate: item.treatment_date,
        notes: [],
        latestPest: '',
        latestVisitType: '',
        activeWarranty: false,
        activeWarrantyUntil: null,
        status: '',
      })
    }

    const current = grouped.get(key)!
    current.total += 1

    if (item.pest_target === 'cucarachas') current.cockroaches += 1
    if (item.pest_target === 'roedores') current.rodents += 1
    if (item.pest_target === 'chinches') current.bedbugs += 1

    if (!current.firstDate || item.treatment_date < current.firstDate) {
      current.firstDate = item.treatment_date
    }
    if (!current.lastDate || item.treatment_date > current.lastDate) {
      current.lastDate = item.treatment_date
    }
    if (item.notes) current.notes.push(item.notes)
  }

  for (const [key, summary] of grouped.entries()) {
    const history = treatments
      .filter((treatment) => (treatment.apartment_key || treatment.apartment_or_area) === key)
      .sort(
        (a, b) =>
          new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime()
      )

    const latest = history[0]

    summary.latestPest = latest?.pest_target
      ? t(`taskLabels.${getPestTargetKey(latest.pest_target)}`)
      : ''

    summary.latestVisitType = latest?.treatment_visit_type
      ? t(`taskLabels.${getVisitTypeKey(latest.treatment_visit_type)}`)
      : ''

    const warranty = history.find((item) => isWarrantySource(item.treatment_visit_type))

    if (warranty) {
      const end = addOneYear(warranty.treatment_date)
      summary.activeWarranty = isWarrantyActive(end)
      summary.activeWarrantyUntil = end
      summary.status = summary.activeWarranty
        ? t('treatmentExport.active')
        : t('treatmentExport.closed')
    }
  }

  const rows = Array.from(grouped.values()).sort((a, b) =>
    a.apartment.localeCompare(b.apartment, locale)
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Concierge App'
  workbook.created = new Date()

  const summarySheet = workbook.addWorksheet(
    safeT(t, 'treatmentExport.sheetName', 'Treatment summary')
  )
  summarySheet.columns = [
    {width: 3},
    {width: 24},
    {width: 12},
    {width: 12},
    {width: 12},
    {width: 14},
    {width: 16},
    {width: 16},
    {width: 18},
    {width: 18},
    {width: 16},
    {width: 16},
    {width: 14},
    {width: 30},
  ]
  applySheetDefaults(summarySheet)
  styleTitle(summarySheet, buildingName, locale, t)

  const totalTreatments = treatments.length
  const activeWarranties = rows.filter((item) => item.activeWarranty).length
  const apartmentsCovered = rows.length
  const followUps = treatments.filter(
    (item) => item.treatment_visit_type === 'seguimiento'
  ).length

  addMetricCard(
    summarySheet,
    'B6:C8',
    safeT(t, 'treatmentExport.metrics.totalTreatments', 'TOTAL TREATMENTS'),
    totalTreatments,
    safeT(t, 'treatmentExport.metrics.totalTreatmentsLine1', 'Recorded visits'),
    safeT(t, 'treatmentExport.metrics.totalTreatmentsLine2', 'In this report'),
    COLORS.green,
    'F8FCFA'
  )
  addMetricCard(
    summarySheet,
    'D6:E8',
    safeT(t, 'treatmentExport.metrics.apartments', 'APARTMENTS / AREAS'),
    apartmentsCovered,
    safeT(t, 'treatmentExport.metrics.apartmentsLine1', 'Unique places'),
    safeT(t, 'treatmentExport.metrics.apartmentsLine2', 'Covered here'),
    COLORS.blue,
    COLORS.blueLight
  )
  addMetricCard(
    summarySheet,
    'F6:G8',
    safeT(t, 'treatmentExport.metrics.followUps', 'FOLLOW-UPS'),
    followUps,
    safeT(t, 'treatmentExport.metrics.followUpsLine1', 'Scheduled or done'),
    safeT(t, 'treatmentExport.metrics.followUpsLine2', 'Visit type'),
    COLORS.amber,
    COLORS.amberLight
  )
  addMetricCard(
    summarySheet,
    'H6:I8',
    safeT(t, 'treatmentExport.metrics.activeWarranties', 'ACTIVE WARRANTIES'),
    activeWarranties,
    safeT(t, 'treatmentExport.metrics.activeWarrantiesLine1', 'Open protections'),
    safeT(t, 'treatmentExport.metrics.activeWarrantiesLine2', 'Per apartment/area'),
    COLORS.red,
    COLORS.redLight
  )

  addSectionTitle(
    summarySheet,
    11,
    safeT(t, 'treatmentExport.sections.summary', '1. TREATMENT SUMMARY')
  )

  const startRow = 12
  summarySheet.getRow(startRow).values = [
    '',
    safeT(t, 'treatmentExport.columns.apartment', 'Apartment'),
    safeT(t, 'treatmentExport.columns.cockroaches', 'Cockroaches'),
    safeT(t, 'treatmentExport.columns.rodents', 'Rodents'),
    safeT(t, 'treatmentExport.columns.bedbugs', 'Bedbugs'),
    safeT(t, 'treatmentExport.columns.total', 'Total treatments'),
    safeT(t, 'treatmentExport.columns.firstDate', 'First date'),
    safeT(t, 'treatmentExport.columns.lastDate', 'Last date'),
    safeT(t, 'treatmentExport.columns.latestPest', 'Latest pest'),
    safeT(t, 'treatmentExport.columns.latestVisit', 'Latest visit type'),
    safeT(t, 'treatmentExport.columns.activeWarranty', 'Active warranty'),
    safeT(t, 'treatmentExport.columns.warrantyUntil', 'Warranty until'),
    safeT(t, 'treatmentExport.columns.status', 'Status'),
    safeT(t, 'treatmentExport.columns.notes', 'Notes'),
  ]
  styleHeader(summarySheet.getRow(startRow))

  rows.forEach((item, index) => {
    summarySheet.getRow(startRow + 1 + index).values = [
      '',
      item.apartment,
      item.cockroaches,
      item.rodents,
      item.bedbugs,
      item.total,
      item.firstDate ? formatDateExport(item.firstDate, locale) : '',
      item.lastDate ? formatDateExport(item.lastDate, locale) : '',
      item.latestPest,
      item.latestVisitType,
      formatYesNo(item.activeWarranty, t),
      item.activeWarrantyUntil ? formatDateExport(item.activeWarrantyUntil, locale) : '',
      item.status,
      item.notes.join(' | '),
    ]
  })

  if (rows.length > 0) {
    styleTableBody(summarySheet, startRow + 1, startRow + rows.length)
  }

  summarySheet.autoFilter = {
    from: `B${startRow}`,
    to: `N${startRow + rows.length}`,
  }

  createDetailSheet(workbook, treatments, locale, t)

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeBuildingName = safeFileName(
    buildingName || safeT(t, 'treatmentExport.noBuilding', 'building')
  )
  const filePrefix = safeFileName(
    safeT(t, 'treatmentExport.filePrefix', 'treatment-report')
  )
  await saveAs(blob, `${filePrefix}-${safeBuildingName}.xlsx`)
}
