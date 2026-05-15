'use client'

import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { InventoryHistory, InventoryItem } from '@/lib/inventory/inventoryTypes'
import {
  formatInventoryQuantity,
  formatInventoryQuantityWithUnit,
  getInventoryHistoryNoteLabel,
  getInventoryItemTypeLabel,
  getInventoryLocationLabel,
  getInventoryUnitLabel,
  translateInventoryCategoryLabel,
  translateCondition,
  translateMovementType,
} from '@/lib/inventory/inventoryUi'

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string

type ExportInventoryToExcelParams = {
  items: InventoryItem[]
  history?: InventoryHistory[]
  buildingName?: string | null
  locale?: string
  t: TranslateFn
  includeMinimumStock?: boolean
  includeHistorySheet?: boolean
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
  muted: '6E7F9D',
  border: 'D9E2EC',
  white: 'FFFFFF',
}

const PROTECTED_WORKSHEET_NAMES = new Set(['history'])

function safeT(
  t: TranslateFn,
  key: string,
  fallback: string,
  values?: Record<string, string | number | Date>
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

function safeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function safeWorksheetName(name: string, fallback: string) {
  const normalized = (name || fallback)
    .replace(/[:\\\\/?*\\[\\]]/g, ' ')
    .trim()
    .slice(0, 31)

  if (!normalized) return fallback
  if (PROTECTED_WORKSHEET_NAMES.has(normalized.toLowerCase())) {
    return fallback
  }

  return normalized
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
}

function formatDate(value?: string | null, locale = 'es-CA') {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value?: string | null, locale = 'es-CA') {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
  sheet.views = [{ showGridLines: false }]
  sheet.properties.defaultRowHeight = 22
  sheet.columns?.forEach((column) => {
    column.alignment = { vertical: 'middle' }
  })
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: { argb: COLORS.white },
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.greenDark },
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.greenDark } },
      left: { style: 'thin', color: { argb: COLORS.greenDark } },
      bottom: { style: 'thin', color: { argb: COLORS.greenDark } },
      right: { style: 'thin', color: { argb: COLORS.greenDark } },
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
        color: { argb: COLORS.text },
      }
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } },
      }
    })

    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FAFCFF' },
        }
      })
    }
  }
}

function addSectionTitle(sheet: ExcelJS.Worksheet, row: number, title: string) {
  sheet.mergeCells(`B${row}:K${row}`)
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
        font: { bold: true, size: 10, color: { argb: color }, name: 'Aptos' },
      },
      {
        text: `${value}\n`,
        font: { bold: true, size: 20, color: { argb: color }, name: 'Aptos' },
      },
      {
        text: `${subtitle1}\n${subtitle2}`,
        font: { size: 10, color: { argb: COLORS.text }, name: 'Aptos' },
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
    fgColor: { argb: bg },
  }
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  }
}

function buildSummaryByCategory(items: InventoryItem[], t: TranslateFn) {
  const map = new Map<
    string,
    { category: string; items: number; totalUnits: number; lowStock: number }
  >()

  for (const item of items) {
    const category =
      translateInventoryCategoryLabel(item.category, t) ||
      safeT(t, 'inventoryExport.noCategory', 'No category')
    if (!map.has(category)) {
      map.set(category, { category, items: 0, totalUnits: 0, lowStock: 0 })
    }
    const row = map.get(category)
    if (!row) continue

    row.items += 1
    row.totalUnits += Number(item.quantity ?? 0)
    if (Number(item.quantity ?? 0) <= Number(item.minimum_stock ?? 0)) {
      row.lowStock += 1
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.category.localeCompare(b.category)
  )
}

function styleTitle(
  sheet: ExcelJS.Worksheet,
  buildingName: string,
  locale: string,
  t: TranslateFn,
  generatedLabel: string,
  generatedByLabel: string,
  reportSubtitle: string
) {
  sheet.mergeCells('B2:C3')
  setCell(sheet, 'B2', 'CONSERJE\nAPP', {
    bold: true,
    size: 18,
    color: COLORS.green,
    align: 'center',
  })

  sheet.mergeCells('D2:I2')
  setCell(
    sheet,
    'D2',
    safeT(t, 'inventoryExport.reportTitle', 'INVENTORY REPORT'),
    {
      bold: true,
      size: 18,
      color: COLORS.greenDark,
    }
  )

  sheet.mergeCells('D3:I3')
  setCell(sheet, 'D3', reportSubtitle, {
    size: 11,
    color: COLORS.text,
  })

  setCell(sheet, 'J2', generatedLabel, { size: 11, color: COLORS.text })
  setCell(sheet, 'K2', formatDate(new Date().toISOString(), locale), {
    size: 11,
    color: COLORS.text,
  })

  setCell(
    sheet,
    'J3',
    safeT(t, 'inventoryExport.buildingLabel', 'Building:'),
    {size: 11, color: COLORS.text}
  )
  setCell(
    sheet,
    'K3',
    buildingName || safeT(t, 'inventoryExport.noBuilding', 'No building'),
    {
    size: 11,
    color: COLORS.text,
    }
  )

  setCell(sheet, 'J4', generatedByLabel, { size: 11, color: COLORS.text })
  setCell(
    sheet,
    'K4',
    safeT(t, 'inventoryExport.concierge', 'Concierge'),
    {size: 11, color: COLORS.text}
  )
}

function addSummaryTable(
  sheet: ExcelJS.Worksheet,
  items: InventoryItem[],
  t: TranslateFn,
  labels: {
    category: string
    items: string
    quantity: string
    lowStock: string
    total: string
  }
) {
  const rows = buildSummaryByCategory(items, t)
  const startRow = 12

  addSectionTitle(
    sheet,
    11,
    safeT(
      t,
      'inventoryExport.sections.summaryByCategory',
      '1. SUMMARY BY CATEGORY'
    )
  )

  sheet.getRow(startRow).values = [
    '',
    labels.category,
    labels.items,
    labels.quantity,
    labels.lowStock,
  ]
  styleHeader(sheet.getRow(startRow))

  rows.forEach((item, index) => {
    const row = sheet.getRow(startRow + 1 + index)
    row.values = [
      '',
      item.category,
      item.items,
      formatInventoryQuantity(item.totalUnits),
      item.lowStock,
    ]
  })

  const totalRow = sheet.getRow(startRow + 1 + rows.length)
  totalRow.values = [
    '',
    labels.total,
    items.length,
    formatInventoryQuantity(
      items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
    ),
    items.filter((item) => Number(item.quantity ?? 0) <= Number(item.minimum_stock ?? 0))
      .length,
  ]

  styleTableBody(sheet, startRow + 1, startRow + 1 + rows.length)
  totalRow.eachCell((cell) => {
    cell.font = { name: 'Aptos', bold: true, size: 10, color: { argb: COLORS.text } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.greenLight },
    }
  })
}

function addStockTable(
  sheet: ExcelJS.Worksheet,
  items: InventoryItem[],
  locale: string,
  t: TranslateFn,
  includeMinimumStock: boolean
) {
  const startRow = 23
  addSectionTitle(
    sheet,
    22,
    safeT(t, 'inventoryExport.sections.currentStock', '2. CURRENT STOCK')
  )

  const headerValues = [
    '',
    safeT(t, 'inventoryExport.columns.name', 'Nombre'),
    safeT(t, 'inventoryExport.columns.category', 'Categoria'),
    safeT(t, 'inventoryExport.columns.itemType', 'Item'),
    safeT(t, 'inventoryExport.columns.unitOfMeasure', 'Unidad'),
    safeT(t, 'inventoryExport.columns.quantity', 'Cantidad'),
    ...(includeMinimumStock
      ? [safeT(t, 'inventoryExport.columns.minimumStock', 'Stock minimo')]
      : []),
    safeT(t, 'inventoryExport.columns.condition', 'Estado'),
    safeT(t, 'inventoryExport.columns.location', 'Ubicacion'),
    safeT(t, 'inventoryExport.columns.notes', 'Notas'),
    safeT(t, 'inventoryExport.columns.updatedAt', 'Actualizado el'),
  ]

  sheet.getRow(startRow).values = headerValues
  styleHeader(sheet.getRow(startRow))

  items.forEach((item, index) => {
    const row = sheet.getRow(startRow + 1 + index)
    row.values = [
      '',
      item.name,
      translateInventoryCategoryLabel(item.category, t),
      getInventoryItemTypeLabel(item, t, item.item_type || item.name || ''),
      getInventoryUnitLabel(item.unit_of_measure, t, item.quantity),
      formatInventoryQuantityWithUnit(item.quantity, item.unit_of_measure, t),
      ...(includeMinimumStock
        ? [
            formatInventoryQuantityWithUnit(
              item.minimum_stock,
              item.unit_of_measure,
              t
            ),
          ]
        : []),
      translateCondition(item.condition, t),
      getInventoryLocationLabel(
        item.location,
        safeT(t, 'flatInventoryRow.noLocation', 'No location'),
        t
      ),
      item.notes || '',
      formatDateTime(item.updated_at, locale),
    ]
  })

  if (items.length > 0) {
    styleTableBody(sheet, startRow + 1, startRow + items.length)
  }

  const endColumn = includeMinimumStock ? 'K' : 'J'
  sheet.autoFilter = {
    from: `B${startRow}`,
    to: `${endColumn}${startRow + Math.max(items.length, 1)}`,
  }
}

function buildHistoryRows(
  history: InventoryHistory[],
  itemNames: Record<string, string>,
  itemUnits: Record<string, string>,
  t: TranslateFn,
  locale: string
) {
  return history.map((entry) => ({
    itemName:
      itemNames[entry.item_id] ||
      (entry.item_id && !isUuid(entry.item_id)
        ? entry.item_id
        : safeT(t, 'inventoryExport.unknownItem', 'Unknown item')),
    action:
      translateMovementType(entry.movement_type, t) ||
      safeT(t, 'inventoryHistoryAction.stockAdjustment', 'Stock adjustment'),
    source:
      entry.source_type === 'task'
        ? entry.source_label?.trim() ||
          safeT(t, 'inventoryHistorySource.task', 'Tarea')
        : entry.source_label?.trim() ||
          (entry.source_type
            ? safeT(
                t,
                `inventoryHistorySource.${entry.source_type}`,
                entry.source_type
              )
            : ''),
    unit: entry.unit_label || '',
    before: formatInventoryQuantityWithUnit(
      entry.quantity_before,
      itemUnits[entry.item_id] || 'unidad',
      t
    ),
    change: `${Number(entry.quantity_change ?? 0) >= 0 ? '+' : ''}${formatInventoryQuantityWithUnit(
      Math.abs(Number(entry.quantity_change ?? 0)),
      itemUnits[entry.item_id] || 'unidad',
      t
    )}`,
    after: formatInventoryQuantityWithUnit(
      entry.quantity_after,
      itemUnits[entry.item_id] || 'unidad',
      t
    ),
    note: getInventoryHistoryNoteLabel(entry.note, t),
    date: formatDateTime(entry.created_at, locale),
  }))
}

function createDetailsSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  fallbackName: string,
  columns: string[],
  rows: (string | number)[][]
) {
  const sheet = workbook.addWorksheet(safeWorksheetName(name, fallbackName))
  sheet.columns = columns.map(() => ({ width: 18 }))
  applySheetDefaults(sheet)
  sheet.getRow(1).values = columns
  styleHeader(sheet.getRow(1))

  rows.forEach((values, index) => {
    sheet.getRow(index + 2).values = values
  })

  if (rows.length > 0) {
    styleTableBody(sheet, 2, rows.length + 1)
  }

  sheet.autoFilter = {
    from: 'A1',
    to: `${String.fromCharCode(64 + columns.length)}${rows.length + 1}`,
  }

  return sheet
}

export async function exportInventoryToExcel({
  items,
  history = [],
  buildingName = 'inventario',
  locale = 'es-CA',
  t,
  includeMinimumStock = true,
  includeHistorySheet = true,
}: ExportInventoryToExcelParams) {
  const safeItems = Array.isArray(items) ? items : []
  const safeHistory = Array.isArray(history) ? history : []

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Conserje App'
  workbook.created = new Date()

  const totalItems = safeItems.length
  const totalUnits = safeItems.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0
  )
  const lowStock = safeItems.filter(
    (item) => Number(item.quantity ?? 0) <= Number(item.minimum_stock ?? 0)
  ).length
  const totalCategories = new Set(
    safeItems.map((item) => item.category?.trim()).filter(Boolean)
  ).size

  const summarySheet = workbook.addWorksheet(
    safeWorksheetName(
      safeT(t, 'inventoryExport.sheet.summary', 'Inventory summary'),
      'Inventory summary'
    )
  )
  summarySheet.columns = [
    { width: 3 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ]
  applySheetDefaults(summarySheet)

  styleTitle(
    summarySheet,
    buildingName || safeT(t, 'inventoryExport.noBuilding', 'No building'),
    locale,
    t,
    safeT(t, 'inventoryExport.generatedAt', 'Fecha de generacion:'),
    safeT(t, 'inventoryExport.generatedBy', 'Generado por:'),
    `${safeT(
      t,
      'inventoryExport.reportSubtitle',
      'Stock and movement summary for the building'
    )} ${buildingName || safeT(t, 'inventoryExport.noBuilding', 'No building')}`
  )

  addMetricCard(
    summarySheet,
    'B6:C8',
    safeT(t, 'inventoryExport.metrics.totalItems', 'ITEMS REGISTRADOS'),
    totalItems,
    safeT(t, 'inventoryExport.metrics.totalItemsLine1', 'Items distintos'),
    safeT(t, 'inventoryExport.metrics.totalItemsLine2', 'En inventario'),
    COLORS.green,
    'F8FCFA'
  )
  addMetricCard(
    summarySheet,
    'D6:E8',
    safeT(t, 'inventoryExport.metrics.totalUnits', 'UNIDADES TOTALES'),
    formatInventoryQuantity(totalUnits),
    safeT(t, 'inventoryExport.metrics.totalUnitsLine1', 'Suma disponible'),
    safeT(t, 'inventoryExport.metrics.totalUnitsLine2', 'Stock actual'),
    COLORS.blue,
    COLORS.blueLight
  )
  addMetricCard(
    summarySheet,
    'F6:G8',
    safeT(t, 'inventoryExport.metrics.lowStock', 'STOCK BAJO'),
    lowStock,
    safeT(t, 'inventoryExport.metrics.lowStockLine1', 'Items en alerta'),
    safeT(t, 'inventoryExport.metrics.lowStockLine2', 'Requieren reposicion'),
    COLORS.red,
    COLORS.redLight
  )
  addMetricCard(
    summarySheet,
    'H6:I8',
    safeT(t, 'inventoryExport.metrics.categories', 'CATEGORIAS'),
    totalCategories,
    safeT(t, 'inventoryExport.metrics.categoriesLine1', 'Categorias activas'),
    safeT(t, 'inventoryExport.metrics.categoriesLine2', 'En esta vista'),
    COLORS.amber,
    COLORS.amberLight
  )

  addSummaryTable(summarySheet, safeItems, t, {
    category: safeT(t, 'inventoryExport.columns.category', 'Categoria'),
    items: safeT(t, 'inventoryExport.metrics.itemsColumn', 'Items'),
    quantity: safeT(t, 'inventoryExport.columns.quantity', 'Cantidad'),
    lowStock: safeT(t, 'inventoryExport.columns.lowStock', 'Stock bajo'),
    total: safeT(t, 'inventoryExport.totalRow', 'TOTAL'),
  })

  addStockTable(summarySheet, safeItems, locale, t, includeMinimumStock)

  const stockColumns = [
    safeT(t, 'inventoryExport.columns.name', 'Nombre'),
    safeT(t, 'inventoryExport.columns.category', 'Categoria'),
    safeT(t, 'inventoryExport.columns.itemType', 'Item'),
    safeT(t, 'inventoryExport.columns.unitOfMeasure', 'Unidad'),
    safeT(t, 'inventoryExport.columns.quantity', 'Cantidad'),
    ...(includeMinimumStock
      ? [safeT(t, 'inventoryExport.columns.minimumStock', 'Stock minimo')]
      : []),
    safeT(t, 'inventoryExport.columns.condition', 'Estado'),
    safeT(t, 'inventoryExport.columns.location', 'Ubicacion'),
    safeT(t, 'inventoryExport.columns.notes', 'Notas'),
    safeT(t, 'inventoryExport.columns.updatedAt', 'Actualizado el'),
  ]
  const stockRows = safeItems.map((item) => [
    item.name,
    translateInventoryCategoryLabel(item.category, t),
    getInventoryItemTypeLabel(item, t, item.item_type || item.name || ''),
    getInventoryUnitLabel(item.unit_of_measure, t, item.quantity),
    formatInventoryQuantityWithUnit(item.quantity, item.unit_of_measure, t),
    ...(includeMinimumStock
      ? [
          formatInventoryQuantityWithUnit(
            item.minimum_stock,
            item.unit_of_measure,
            t
          ),
        ]
      : []),
    translateCondition(item.condition, t),
    getInventoryLocationLabel(
      item.location,
      safeT(t, 'flatInventoryRow.noLocation', 'No location'),
      t
    ),
    item.notes || '',
    formatDateTime(item.updated_at, locale),
  ])
  createDetailsSheet(
    workbook,
    safeT(t, 'inventoryExport.sheet.inventory', 'Inventory'),
    'Inventory',
    stockColumns,
    stockRows
  )

  if (includeHistorySheet) {
    const itemNames = Object.fromEntries(
      safeItems.map((item) => [item.id, item.name || item.id])
    )
    const itemUnits = Object.fromEntries(
      safeItems.map((item) => [item.id, item.unit_of_measure || 'unidad'])
    )
    const historyColumns = [
      safeT(t, 'inventoryExport.history.itemName', 'Item'),
      safeT(t, 'inventoryExport.history.action', 'Accion'),
      safeT(t, 'inventoryExport.history.source', 'Origen'),
      safeT(t, 'inventoryExport.history.unit', 'Unidad'),
      safeT(t, 'inventoryExport.history.before', 'Antes'),
      safeT(t, 'inventoryExport.history.change', 'Cambio'),
      safeT(t, 'inventoryExport.history.after', 'Despues'),
      safeT(t, 'inventoryExport.history.note', 'Nota'),
      safeT(t, 'inventoryExport.history.date', 'Fecha'),
    ]
    const historyRows = buildHistoryRows(
      safeHistory,
      itemNames,
      itemUnits,
      t,
      locale
    ).map((entry) => [
      entry.itemName,
      entry.action,
      entry.source,
      entry.unit,
      entry.before,
      entry.change,
      entry.after,
      entry.note,
      entry.date,
    ])
    createDetailsSheet(
      workbook,
      safeT(t, 'inventoryExport.sheet.history', 'Inventory history'),
      'Inventory history',
      historyColumns,
      historyRows
    )
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const date = new Date().toISOString().split('T')[0]
  const safeBuildingName = safeFileName(
    buildingName || safeT(t, 'inventoryExport.noBuilding', 'inventory')
  )
  const filePrefix = safeFileName(
    safeT(t, 'inventoryExport.filePrefix', 'inventory-report')
  )
  saveAs(blob, `${filePrefix}-${safeBuildingName}-${date}.xlsx`)
}
