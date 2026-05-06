'use client'

import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const HEADER_FILL = '355E52'
const HEADER_TEXT = 'FFFFFF'
const SECTION_FILL = 'E8EEF9'
const SECTION_TEXT = '142952'
const BORDER = 'D8E1EE'
const SOFT_BORDER = 'EEF2F7'

export function createStyledWorkbook() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Concierge App'
  workbook.created = new Date()
  return workbook
}

export function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: HEADER_TEXT } }
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER } },
      left: { style: 'thin', color: { argb: BORDER } },
      bottom: { style: 'thin', color: { argb: BORDER } },
      right: { style: 'thin', color: { argb: BORDER } },
    }
    cell.alignment = { vertical: 'middle' }
  })
  row.height = 24
}

export function applySectionRowStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: SECTION_TEXT } }
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_FILL },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER } },
      left: { style: 'thin', color: { argb: BORDER } },
      bottom: { style: 'thin', color: { argb: BORDER } },
      right: { style: 'thin', color: { argb: BORDER } },
    }
  })
}

export function applyDataRowStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: SOFT_BORDER } },
      left: { style: 'thin', color: { argb: SOFT_BORDER } },
      bottom: { style: 'thin', color: { argb: SOFT_BORDER } },
      right: { style: 'thin', color: { argb: SOFT_BORDER } },
    }
    cell.alignment = { vertical: 'top', wrapText: true }
  })
}

export async function downloadWorkbook(
  workbook: ExcelJS.Workbook,
  fileName: string
) {
  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName
  )
}
