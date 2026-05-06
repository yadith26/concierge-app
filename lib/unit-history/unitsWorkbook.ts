'use client'

import type { TranslationValues } from 'next-intl'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  applyDataRowStyle,
  applyHeaderStyle,
  applySectionRowStyle,
  createStyledWorkbook,
} from '@/lib/export/excelStyles'
import { isApartmentReference } from '@/lib/locations/normalizeApartment'
import { compareApartmentLabels } from '@/lib/tasks/pestHistoryHelpers'

type TranslateFn = (key: string, values?: TranslationValues) => string

const COLORS = {
  greenDark: '145C43',
  greenLight: 'EAF4EE',
  blue: '2F66C8',
  blueLight: 'EEF4FF',
  amber: 'E88A00',
  amberLight: 'FFF7E6',
  mint: '0F7A58',
  mintLight: 'E9F7F0',
  red: 'D64555',
  redLight: 'FFF1F3',
  purple: '8A55CC',
  purpleLight: 'F5EEFF',
  slateLight: 'F5F8FF',
  text: '142952',
  border: 'D9E2EC',
}

export type UnitHistoryRow = {
  unit_key: string
  unit_label: string
  event_type: string
  event_category: string
  title: string
  description: string | null
  happened_at: string
  source_table: string
}

export type UnitCardSummary = {
  unitKey: string
  unitLabel: string
  totalEvents: number
  lastEventTitle: string
  lastEventDate: string
  lastEventCategory: string
}

type ExportUnitsWorkbookParams = {
  buildingName: string
  apartments: UnitCardSummary[]
  common: UnitCardSummary[]
  rows: UnitHistoryRow[]
  locale?: string
  t: TranslateFn
}

function safeT(
  t: TranslateFn,
  key: string,
  fallback: string,
  values?: TranslationValues
) {
  const maybeHas = (t as TranslateFn & { has?: (key: string) => boolean }).has
  if (typeof maybeHas === 'function' && !maybeHas(key)) {
    return fallback
  }

  try {
    return t(key, values)
  } catch {
    return fallback
  }
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function formatHistoryDate(date: string, locale = 'es-CA') {
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
    bg?: string
    align?: 'left' | 'center' | 'right'
  }
) {
  const current = sheet.getCell(cell)
  current.value = value
  current.font = {
    name: 'Aptos',
    size: options?.size ?? 11,
    bold: options?.bold ?? false,
    color: { argb: options?.color ?? COLORS.text },
  }
  current.alignment = {
    vertical: 'middle',
    horizontal: options?.align ?? 'left',
    wrapText: true,
  }

  if (options?.bg) {
    current.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.bg },
    }
  }
}

function applySheetDefaults(sheet: ExcelJS.Worksheet) {
  sheet.properties.defaultRowHeight = 22
  sheet.views = [{ showGridLines: false }]
}

export function formatRecordCategory(category: string, t?: TranslateFn) {
  if (!t) {
    switch (category) {
      case 'paint':
        return 'Pintura'
      case 'repair':
        return 'Reparacion'
      case 'change':
        return 'Reemplazo'
      case 'delivery':
        return 'Entrega'
      case 'pest':
        return 'Plagas'
      case 'inspection':
        return 'Inspeccion'
      default:
        return category
    }
  }

  switch (category) {
    case 'paint':
      return safeT(t, 'unitExport.categories.paint', 'Pintura')
    case 'repair':
      return safeT(t, 'unitExport.categories.repair', 'Reparacion')
    case 'change':
      return safeT(t, 'unitExport.categories.change', 'Reemplazo')
    case 'delivery':
      return safeT(t, 'unitExport.categories.delivery', 'Entrega')
    case 'pest':
      return safeT(t, 'unitExport.categories.pest', 'Plagas')
    case 'inspection':
      return safeT(t, 'unitExport.categories.inspection', 'Inspeccion')
    default:
      return category
  }
}

function getCategoryTone(category: string) {
  switch (category) {
    case 'pest':
      return { text: COLORS.red, bg: COLORS.redLight }
    case 'repair':
      return { text: COLORS.blue, bg: COLORS.blueLight }
    case 'paint':
      return { text: COLORS.amber, bg: COLORS.amberLight }
    case 'delivery':
    case 'change':
      return { text: COLORS.purple, bg: COLORS.purpleLight }
    case 'inspection':
      return { text: COLORS.mint, bg: COLORS.mintLight }
    default:
      return { text: COLORS.text, bg: COLORS.slateLight }
  }
}

function buildSummaryByCategory(rows: UnitHistoryRow[], t: TranslateFn) {
  const map = new Map<
    string,
    { count: number; apartments: Set<string>; common: Set<string> }
  >()

  rows.forEach((row) => {
    const key = row.event_category || 'other'
    if (!map.has(key)) {
      map.set(key, { count: 0, apartments: new Set(), common: new Set() })
    }
    const current = map.get(key)!
    current.count += 1
    if (isApartmentReference(row.unit_label)) {
      current.apartments.add(row.unit_label)
    } else {
      current.common.add(row.unit_label)
    }
  })

  return Array.from(map.entries())
    .map(([category, stats]) => ({
      category: formatRecordCategory(category, t),
      count: stats.count,
      apartments: stats.apartments.size,
      common: stats.common.size,
    }))
    .sort((a, b) => b.count - a.count)
}

function buildDetailsRows(rows: UnitHistoryRow[], t: TranslateFn, locale: string) {
  return rows.map((row) => ({
    group: isApartmentReference(row.unit_label)
      ? safeT(t, 'unitExport.groups.apartments', 'Apartamentos')
      : safeT(t, 'unitExport.groups.common', 'Areas comunes'),
    unit: row.unit_label,
    recordType:
      row.event_type === 'pest_treatment_recorded'
        ? safeT(t, 'unitExport.recordTypes.treatment', 'Tratamiento')
        : safeT(t, 'unitExport.recordTypes.completedTask', 'Tarea completada'),
    category: formatRecordCategory(row.event_category, t),
    title: row.title,
    description: row.description?.trim() || '',
    source:
      row.source_table === 'pest_treatments'
        ? safeT(t, 'unitExport.sources.treatments', 'Tratamientos')
        : safeT(t, 'unitExport.sources.tasks', 'Tareas'),
    date: formatHistoryDate(row.happened_at, locale),
    year: new Date(`${row.happened_at}T12:00:00`).getFullYear().toString(),
    sortDate: row.happened_at,
  }))
}

function addMetricCard(
  sheet: ExcelJS.Worksheet,
  range: string,
  title: string,
  line1: string,
  line2: string,
  value: number,
  tone: string,
  light: string
) {
  sheet.mergeCells(range)
  const cell = sheet.getCell(range.split(':')[0])
  cell.value = {
    richText: [
      {
        text: `${title}\n`,
        font: {
          name: 'Aptos',
          size: 10,
          bold: true,
          color: { argb: tone },
        },
      },
      {
        text: `\n${value}\n`,
        font: {
          name: 'Aptos',
          size: 24,
          bold: true,
          color: { argb: COLORS.text },
        },
      },
      {
        text: `${line1}\n${line2}`,
        font: {
          name: 'Aptos',
          size: 10,
          color: { argb: COLORS.text },
        },
      },
    ],
  }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: light },
  }
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  }
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
}

function addTitleBlock(
  sheet: ExcelJS.Worksheet,
  buildingName: string,
  locale: string,
  t: TranslateFn
) {
  sheet.mergeCells('A2:C4')
  sheet.mergeCells('D2:H3')
  sheet.mergeCells('I2:J2')
  sheet.mergeCells('I3:J3')
  sheet.mergeCells('I4:J4')

  setCell(sheet, 'A2', 'CONSERJE APP', {
    bold: true,
    size: 18,
    color: COLORS.greenDark,
    align: 'center',
  })

  setCell(
    sheet,
    'D2',
    safeT(t, 'unitExport.reportTitle', 'REPORTE DE APARTAMENTOS'),
    {
      bold: true,
      size: 20,
      color: COLORS.greenDark,
    }
  )
  setCell(
    sheet,
    'D4',
    `${safeT(
      t,
      'unitExport.reportSubtitle',
      'Historial de trabajos realizados por apartamento y areas comunes'
    )} · ${buildingName}`,
    { size: 11, color: COLORS.text }
  )

  sheet.getRow(2).height = 28
  sheet.getRow(3).height = 22
  sheet.getRow(4).height = 24

  const today = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  setCell(sheet, 'I2', safeT(t, 'unitExport.generatedAt', 'Fecha de generacion:'), {
    bold: true,
  })
  setCell(sheet, 'J2', today)
  setCell(sheet, 'I3', safeT(t, 'unitExport.building', 'Edificio:'), {
    bold: true,
  })
  setCell(sheet, 'J3', buildingName)
  setCell(sheet, 'I4', safeT(t, 'unitExport.generatedBy', 'Generado por:'), {
    bold: true,
  })
  setCell(sheet, 'J4', safeT(t, 'unitExport.generatedByValue', 'Manager'))
}

function addSummaryTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rows: ReturnType<typeof buildSummaryByCategory>,
  t: TranslateFn
) {
  sheet.mergeCells(`A${startRow}:J${startRow}`)
  setCell(
    sheet,
    `A${startRow}`,
    safeT(t, 'unitExport.sections.summary', '1. RESUMEN POR CATEGORIA'),
    { bold: true, size: 16, color: COLORS.greenDark }
  )

  const headerRow = sheet.getRow(startRow + 2)
  headerRow.values = [
    '',
    safeT(t, 'unitExport.columns.category', 'Categoria'),
    safeT(t, 'unitExport.columns.records', 'Trabajos'),
    safeT(t, 'unitExport.columns.apartments', 'Apartamentos'),
    safeT(t, 'unitExport.columns.commonAreas', 'Areas comunes'),
  ]
  applyHeaderStyle(headerRow)
  headerRow.height = 24

  rows.forEach((row) => {
    const dataRow = sheet.addRow(['', row.category, row.count, row.apartments, row.common])
    applyDataRowStyle(dataRow)
    dataRow.height = 22
  })

  const totals = rows.reduce(
    (acc, row) => {
      acc.records += row.count
      acc.apartments += row.apartments
      acc.common += row.common
      return acc
    },
    { records: 0, apartments: 0, common: 0 }
  )

  const totalRow = sheet.addRow([
    '',
    safeT(t, 'unitExport.totalRow', 'TOTAL'),
    totals.records,
    totals.apartments,
    totals.common,
  ])
  applySectionRowStyle(totalRow)
  totalRow.height = 24
}

function addUnitsTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  groups: Array<{ label: string; items: UnitCardSummary[] }>,
  t: TranslateFn,
  locale: string
) {
  sheet.mergeCells(`A${startRow}:J${startRow}`)
  setCell(
    sheet,
    `A${startRow}`,
    safeT(t, 'unitExport.sections.units', '2. RESUMEN POR UNIDAD'),
    { bold: true, size: 16, color: COLORS.greenDark }
  )

  const headerRow = sheet.getRow(startRow + 2)
  headerRow.values = [
    '',
    safeT(t, 'unitExport.columns.group', 'Grupo'),
    safeT(t, 'unitExport.columns.unit', 'Unidad'),
    safeT(t, 'unitExport.columns.records', 'Trabajos'),
    safeT(t, 'unitExport.columns.lastRecord', 'Ultimo trabajo'),
    safeT(t, 'unitExport.columns.lastCategory', 'Ultima categoria'),
    safeT(t, 'unitExport.columns.lastDate', 'Ultima fecha'),
  ]
  applyHeaderStyle(headerRow)
  headerRow.height = 24

  groups.forEach((group) => {
    group.items.forEach((unit) => {
      const row = sheet.addRow([
        '',
        group.label,
        unit.unitLabel,
        unit.totalEvents,
        unit.lastEventTitle,
        formatRecordCategory(unit.lastEventCategory, t),
        formatHistoryDate(unit.lastEventDate, locale),
      ])
      applyDataRowStyle(row)
      row.height = 22
    })
  })

  const totalUnits = groups.reduce((sum, group) => sum + group.items.length, 0)
  const totalEvents = groups.reduce(
    (sum, group) =>
      sum + group.items.reduce((groupSum, unit) => groupSum + unit.totalEvents, 0),
    0
  )

  const totalRow = sheet.addRow([
    '',
    safeT(t, 'unitExport.totalRow', 'TOTAL'),
    totalUnits,
    totalEvents,
    '',
    '',
    '',
  ])
  applySectionRowStyle(totalRow)
  totalRow.height = 24
}

export async function exportUnitsWorkbook({
  buildingName,
  apartments,
  common,
  rows,
  locale = 'es-CA',
  t,
}: ExportUnitsWorkbookParams) {
  const groups = [
    { label: safeT(t, 'unitExport.groups.apartments', 'Apartamentos'), items: apartments },
    { label: safeT(t, 'unitExport.groups.common', 'Areas comunes'), items: common },
  ].filter((group) => group.items.length > 0)

  if (!groups.length) return

  const workbook = createStyledWorkbook()
  const summarySheet = workbook.addWorksheet(
    safeT(t, 'unitExport.sheet.summary', 'Resumen'),
    {
      views: [{ state: 'frozen', ySplit: 1 }],
    }
  )

  applySheetDefaults(summarySheet)
  summarySheet.columns = [
    { width: 4 },
    { width: 20 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ]
  summarySheet.getRow(7).height = 26
  summarySheet.getRow(8).height = 26
  summarySheet.getRow(9).height = 24
  summarySheet.getRow(10).height = 24

  addTitleBlock(summarySheet, buildingName, locale, t)

  addMetricCard(
    summarySheet,
    'A7:B10',
    safeT(t, 'unitExport.metrics.totalUnits', 'UNIDADES'),
    safeT(t, 'unitExport.metrics.totalUnitsLine1', 'Con historial'),
    safeT(t, 'unitExport.metrics.totalUnitsLine2', 'Registradas'),
    apartments.length + common.length,
    COLORS.greenDark,
    COLORS.greenLight
  )
  addMetricCard(
    summarySheet,
    'C7:D10',
    safeT(t, 'unitExport.metrics.totalRecords', 'TRABAJOS'),
    safeT(t, 'unitExport.metrics.totalRecordsLine1', 'Eventos totales'),
    safeT(t, 'unitExport.metrics.totalRecordsLine2', 'Registrados'),
    rows.length,
    COLORS.blue,
    COLORS.blueLight
  )
  addMetricCard(
    summarySheet,
    'E7:F10',
    safeT(t, 'unitExport.metrics.apartments', 'APTOS'),
    safeT(t, 'unitExport.metrics.apartmentsLine1', 'Con trabajos'),
    safeT(t, 'unitExport.metrics.apartmentsLine2', 'Registrados'),
    apartments.length,
    COLORS.amber,
    COLORS.amberLight
  )
  addMetricCard(
    summarySheet,
    'G7:H10',
    safeT(t, 'unitExport.metrics.common', 'AREAS'),
    safeT(t, 'unitExport.metrics.commonLine1', 'Comunes con'),
    safeT(t, 'unitExport.metrics.commonLine2', 'Historial'),
    common.length,
    COLORS.mint,
    COLORS.mintLight
  )

  addSummaryTable(summarySheet, 13, buildSummaryByCategory(rows, t), t)
  addUnitsTable(summarySheet, 23, groups, t, locale)

  const detailedRows = buildDetailsRows(rows, t, locale)
  if (detailedRows.length > 0) {
    const rowsByYear = detailedRows.reduce<Record<string, typeof detailedRows>>(
      (accumulator, row) => {
        if (!accumulator[row.year]) {
          accumulator[row.year] = []
        }
        accumulator[row.year].push(row)
        return accumulator
      },
      {}
    )

    Object.keys(rowsByYear)
      .sort((a, b) => Number(b) - Number(a))
      .forEach((year) => {
        const yearSheet = workbook.addWorksheet(year, {
          views: [{ state: 'frozen', ySplit: 1 }],
        })
        yearSheet.columns = [
          { header: safeT(t, 'unitExport.columns.unit', 'Unidad'), key: 'unit', width: 28 },
          {
            header: safeT(t, 'unitExport.columns.recordType', 'Tipo de registro'),
            key: 'recordType',
            width: 20,
          },
          {
            header: safeT(t, 'unitExport.columns.category', 'Categoria'),
            key: 'category',
            width: 18,
          },
          { header: safeT(t, 'unitExport.columns.title', 'Titulo'), key: 'title', width: 36 },
          {
            header: safeT(t, 'unitExport.columns.description', 'Descripcion'),
            key: 'description',
            width: 46,
          },
          { header: safeT(t, 'unitExport.columns.source', 'Origen'), key: 'source', width: 20 },
          { header: safeT(t, 'unitExport.columns.date', 'Fecha'), key: 'date', width: 16 },
        ]
        applyHeaderStyle(yearSheet.getRow(1))
        yearSheet.getRow(1).height = 24

        const apartmentLabel = safeT(t, 'unitExport.groups.apartments', 'Apartamentos')
        const yearRows = [...rowsByYear[year]].sort((a, b) => {
          const groupCompare = a.group === b.group ? 0 : a.group === apartmentLabel ? -1 : 1
          if (groupCompare !== 0) return groupCompare

          if (a.group === apartmentLabel && b.group === apartmentLabel) {
            const apartmentCompare = compareApartmentLabels(a.unit, b.unit)
            if (apartmentCompare !== 0) return apartmentCompare
          } else {
            const labelCompare = a.unit.localeCompare(b.unit, 'en', {
              sensitivity: 'base',
            })
            if (labelCompare !== 0) return labelCompare
          }

          return b.sortDate.localeCompare(a.sortDate)
        })

        let currentUnit = ''
        let currentGroup = ''
        for (const row of yearRows) {
          const sameUnit = row.unit === currentUnit && row.group === currentGroup

          if (!sameUnit) {
            currentUnit = row.unit
            currentGroup = row.group

            const unitRow = yearSheet.addRow({
              unit: row.unit,
              recordType: '',
              category: '',
              title: '',
              description: '',
              source: '',
              date: '',
            })
            applySectionRowStyle(unitRow)
            unitRow.height = 22
          }

          const detailRow = yearSheet.addRow({
            unit: '',
            recordType: row.recordType,
            category: row.category,
            title: row.title,
            description: row.description,
            source: row.source,
            date: row.date,
          })
          applyDataRowStyle(detailRow)
          detailRow.height = 22

          const tone = getCategoryTone(
            rows.find(
              (sourceRow) =>
                sourceRow.title === row.title &&
                sourceRow.unit_label === row.unit &&
                formatHistoryDate(sourceRow.happened_at, locale) === row.date
            )?.event_category || ''
          )
          const categoryCell = detailRow.getCell(3)
          categoryCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: tone.bg },
          }
          categoryCell.font = {
            name: 'Aptos',
            size: 11,
            bold: true,
            color: { argb: tone.text },
          }
        }

        const totalYearRow = yearSheet.addRow({
          unit: safeT(t, 'unitExport.totalRow', 'TOTAL'),
          recordType: yearRows.length,
          category: '',
          title: '',
          description: '',
          source: '',
          date: '',
        })
        applySectionRowStyle(totalYearRow)
        totalYearRow.height = 24

        yearSheet.autoFilter = 'A1:G1'
      })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${sanitizeFileName(buildingName || 'building') || 'building'}-trabajos-apartamentos.xlsx`
  )
}
