import {
  getPestTargetKey,
  getVisitTypeKey,
} from '@/lib/tasks/taskLabels'
import {
  applyDataRowStyle,
  applyHeaderStyle,
  createStyledWorkbook,
  downloadWorkbook,
} from '@/lib/export/excelStyles'

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

type ApartmentSummary = {
  apartment: string
  cucarachas: number
  roedores: number
  chinches: number
  total: number
  firstDate: string | null
  lastDate: string | null
  notes: string[]
  recurrentCockroaches: boolean
  recurrentRodents: boolean
  recurrentBedbugs: boolean
  hasRecurrentProblem: boolean
  latestPest: string
  latestVisitType: string
  activeWarranty: boolean
  activeWarrantyUntil: string | null
  status: string
}

function formatDateExport(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale).format(
    new Date(`${date}T12:00:00`)
  )
}

function formatYesNo(value: boolean, t: (key: string) => string) {
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

export async function exportTreatmentHistoryToExcel({
  treatments,
  buildingName,
  locale,
  t,
}: {
  treatments: ExportTreatmentRow[]
  buildingName: string
  locale: string
  t: (key: string) => string
}) {
  if (!treatments.length) return

  const grouped = new Map<string, ApartmentSummary>()

  for (const item of treatments) {
    const key = item.apartment_key || item.apartment_or_area

    if (!grouped.has(key)) {
      grouped.set(key, {
        apartment: item.apartment_or_area,
        cucarachas: 0,
        roedores: 0,
        chinches: 0,
        total: 0,
        firstDate: item.treatment_date,
        lastDate: item.treatment_date,
        notes: [],
        recurrentCockroaches: false,
        recurrentRodents: false,
        recurrentBedbugs: false,
        hasRecurrentProblem: false,
        latestPest: '',
        latestVisitType: '',
        activeWarranty: false,
        activeWarrantyUntil: null,
        status: '',
      })
    }

    const current = grouped.get(key)!
    current.total++

    if (item.pest_target === 'cucarachas') current.cucarachas++
    if (item.pest_target === 'roedores') current.roedores++
    if (item.pest_target === 'chinches') current.chinches++

    if (item.notes) current.notes.push(item.notes)
  }

  for (const [key, summary] of grouped.entries()) {
    const history = treatments
      .filter((t) => (t.apartment_key || t.apartment_or_area) === key)
      .sort(
        (a, b) =>
          new Date(b.treatment_date).getTime() -
          new Date(a.treatment_date).getTime()
      )

    const latest = history[0]

    summary.latestPest = latest?.pest_target
      ? t(`taskLabels.${getPestTargetKey(latest.pest_target)}`)
      : ''

    summary.latestVisitType = latest?.treatment_visit_type
      ? t(`taskLabels.${getVisitTypeKey(latest.treatment_visit_type)}`)
      : ''

    const warranty = history.find((h) =>
      isWarrantySource(h.treatment_visit_type)
    )

    if (warranty) {
      const end = addOneYear(warranty.treatment_date)
      summary.activeWarranty = isWarrantyActive(end)
      summary.activeWarrantyUntil = end
      summary.status = summary.activeWarranty
        ? t('treatmentExport.active')
        : t('treatmentExport.closed')
    }
  }

  const rows = Array.from(grouped.values()).map((item) => ({
    [t('treatmentExport.columns.apartment')]: item.apartment,
    [t('treatmentExport.columns.cockroaches')]: item.cucarachas,
    [t('treatmentExport.columns.rodents')]: item.roedores,
    [t('treatmentExport.columns.bedbugs')]: item.chinches,
    [t('treatmentExport.columns.total')]: item.total,
    [t('treatmentExport.columns.firstDate')]: item.firstDate
      ? formatDateExport(item.firstDate, locale)
      : '',
    [t('treatmentExport.columns.lastDate')]: item.lastDate
      ? formatDateExport(item.lastDate, locale)
      : '',
    [t('treatmentExport.columns.latestPest')]: item.latestPest,
    [t('treatmentExport.columns.latestVisit')]: item.latestVisitType,
    [t('treatmentExport.columns.activeWarranty')]: formatYesNo(
      item.activeWarranty,
      t
    ),
    [t('treatmentExport.columns.warrantyUntil')]: item.activeWarrantyUntil
      ? formatDateExport(item.activeWarrantyUntil, locale)
      : '',
    [t('treatmentExport.columns.status')]: item.status,
    [t('treatmentExport.columns.notes')]: item.notes.join(' | '),
  }))

  const workbook = createStyledWorkbook()
  const worksheet = workbook.addWorksheet(t('treatmentExport.sheetName'), {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  worksheet.columns = [
    { header: t('treatmentExport.columns.apartment'), key: 'apartment', width: 20 },
    { header: t('treatmentExport.columns.cockroaches'), key: 'cockroaches', width: 12 },
    { header: t('treatmentExport.columns.rodents'), key: 'rodents', width: 12 },
    { header: t('treatmentExport.columns.bedbugs'), key: 'bedbugs', width: 12 },
    { header: t('treatmentExport.columns.total'), key: 'total', width: 10 },
    { header: t('treatmentExport.columns.firstDate'), key: 'firstDate', width: 16 },
    { header: t('treatmentExport.columns.lastDate'), key: 'lastDate', width: 16 },
    { header: t('treatmentExport.columns.latestPest'), key: 'latestPest', width: 18 },
    { header: t('treatmentExport.columns.latestVisit'), key: 'latestVisit', width: 18 },
    { header: t('treatmentExport.columns.activeWarranty'), key: 'activeWarranty', width: 14 },
    { header: t('treatmentExport.columns.warrantyUntil'), key: 'warrantyUntil', width: 16 },
    { header: t('treatmentExport.columns.status'), key: 'status', width: 14 },
    { header: t('treatmentExport.columns.notes'), key: 'notes', width: 36 },
  ]
  applyHeaderStyle(worksheet.getRow(1))

  rows.forEach((item) => {
    const row = worksheet.addRow({
      apartment: item[t('treatmentExport.columns.apartment')],
      cockroaches: item[t('treatmentExport.columns.cockroaches')],
      rodents: item[t('treatmentExport.columns.rodents')],
      bedbugs: item[t('treatmentExport.columns.bedbugs')],
      total: item[t('treatmentExport.columns.total')],
      firstDate: item[t('treatmentExport.columns.firstDate')],
      lastDate: item[t('treatmentExport.columns.lastDate')],
      latestPest: item[t('treatmentExport.columns.latestPest')],
      latestVisit: item[t('treatmentExport.columns.latestVisit')],
      activeWarranty: item[t('treatmentExport.columns.activeWarranty')],
      warrantyUntil: item[t('treatmentExport.columns.warrantyUntil')],
      status: item[t('treatmentExport.columns.status')],
      notes: item[t('treatmentExport.columns.notes')],
    })
    applyDataRowStyle(row)
  })
  worksheet.autoFilter = 'A1:M1'

  await downloadWorkbook(
    workbook,
    `${t('treatmentExport.filePrefix')}_${buildingName}.xlsx`
  )
}
