import { supabase } from '@/lib/supabase'
import { formatApartmentLabel, normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import type {
  PestTarget,
  TaskApartment,
  TaskCategory,
  TaskPriority,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'

type SupportedTaskHistoryCategory = Exclude<TaskCategory, 'cleaning' | 'visit' | 'other' | 'pest'>
type RelevantTaskHistoryCategory = SupportedTaskHistoryCategory | 'pest'

type UnitHistoryInsertRow = {
  building_id: string
  unit_key: string
  unit_label: string
  event_type: 'task_completed' | 'pest_treatment_recorded'
  event_category: RelevantTaskHistoryCategory
  title: string
  description: string | null
  happened_at: string
  source_table: 'tasks' | 'pest_treatments'
  source_id: string
  created_by: string | null
  metadata: Record<string, unknown>
  updated_at: string
}

type TaskHistorySource = {
  id: string
  building_id: string
  title: string
  description: string | null
  category: TaskCategory
  priority: TaskPriority
  task_date: string
  apartment_or_area: string | null
  apartment_key?: string | null
}

const RELEVANT_TASK_CATEGORIES: SupportedTaskHistoryCategory[] = [
  'repair',
  'paint',
  'change',
  'delivery',
  'inspection',
]

function normalizeText(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function getApplianceLabel(text: string) {
  if (
    text.includes('refrigerador') ||
    text.includes('nevera') ||
    text.includes('fridge') ||
    text.includes('refrigerator')
  ) {
    return 'Refrigerator'
  }

  if (
    text.includes('cocina') ||
    text.includes('estufa') ||
    text.includes('stove') ||
    text.includes('range') ||
    text.includes('oven')
  ) {
    return 'Stove'
  }

  if (
    text.includes('aire acondicionado') ||
    text.includes('air conditioner')
  ) {
    return 'Air conditioner'
  }

  return null
}

function getRepairLabel(text: string) {
  if (text.includes('grifo') || text.includes('faucet')) {
    return 'Faucet repair'
  }

  if (text.includes('toilet') || text.includes('inodoro')) {
    return 'Toilet repair'
  }

  if (text.includes('sink') || text.includes('lavamanos') || text.includes('fregadero')) {
    return 'Sink repair'
  }

  if (text.includes('door') || text.includes('puerta')) {
    return 'Door repair'
  }

  if (text.includes('window') || text.includes('ventana')) {
    return 'Window repair'
  }

  return null
}

function getInspectionLabel(text: string) {
  if (text.includes('move out') || text.includes('mudanza')) {
    return 'Move-out inspection'
  }

  if (text.includes('move in')) {
    return 'Move-in inspection'
  }

  return 'Inspection completed'
}

function buildTaskHistoryTitle(task: TaskHistorySource) {
  const combinedText = normalizeText(`${task.title} ${task.description || ''}`)

  if (task.category === 'change' || task.category === 'delivery') {
    const applianceLabel = getApplianceLabel(combinedText)
    return applianceLabel ? `${applianceLabel} installed` : 'Delivery completed'
  }

  if (task.category === 'paint') {
    if (combinedText.includes('kitchen') || combinedText.includes('cocina')) {
      return 'Kitchen painted'
    }

    if (combinedText.includes('bedroom') || combinedText.includes('dormitorio')) {
      return 'Bedroom painted'
    }

    if (
      combinedText.includes('bathroom') ||
      combinedText.includes('bano') ||
      combinedText.includes('baño')
    ) {
      return 'Bathroom painted'
    }

    return 'Painting completed'
  }

  if (task.category === 'repair') {
    return getRepairLabel(combinedText) || 'Repair completed'
  }

  if (task.category === 'inspection') {
    return getInspectionLabel(combinedText)
  }

  return task.title
}

function formatPestTargetLabel(target: PestTarget | null) {
  if (target === 'cucarachas') return 'Cockroach'
  if (target === 'roedores') return 'Rodent'
  if (target === 'chinches') return 'Bedbug'
  return 'Pest'
}

function buildPestTreatmentTitle(treatment: PestTreatmentRow) {
  const pestLabel = formatPestTargetLabel(treatment.pest_target)

  if (treatment.treatment_visit_type === 'seguimiento') {
    return `${pestLabel} follow-up`
  }

  if (treatment.treatment_visit_type === 'preventivo') {
    return `${pestLabel} preventive treatment`
  }

  return `${pestLabel} treatment`
}

function getUnitReference(
  unitLabel?: string | null,
  unitKey?: string | null
): { unit_key: string; unit_label: string } | null {
  const cleanLabel = unitLabel?.trim() || ''
  const normalizedKey = (unitKey?.trim() || normalizeApartmentKey(cleanLabel)).trim()

  if (!cleanLabel || !normalizedKey) {
    return null
  }

  return {
    unit_key: normalizedKey,
    unit_label: formatApartmentLabel(cleanLabel) || cleanLabel,
  }
}

async function upsertUnitHistory(rows: UnitHistoryInsertRow[]) {
  if (!rows.length) return

  const { error } = await supabase.from('unit_history').upsert(rows, {
    onConflict: 'source_table,source_id,unit_key,event_type',
    ignoreDuplicates: false,
  })

  if (error) {
    throw error
  }
}

export async function recordCompletedTaskInUnitHistory(params: {
  task: TaskHistorySource
  profileId: string
  taskApartments?: TaskApartment[]
}) {
  const { task, profileId, taskApartments = [] } = params

  if (!RELEVANT_TASK_CATEGORIES.includes(task.category as SupportedTaskHistoryCategory)) {
    return
  }

  const nowIso = new Date().toISOString()
  const apartmentSources = taskApartments.length
    ? taskApartments.map((item) => ({
        apartment_or_area: item.apartment_or_area,
        apartment_key: item.apartment_key,
      }))
    : [
        {
          apartment_or_area: task.apartment_or_area,
          apartment_key: task.apartment_key ?? null,
        },
      ]

  const rows: UnitHistoryInsertRow[] = apartmentSources.reduce<UnitHistoryInsertRow[]>(
    (acc, item) => {
      const unitReference = getUnitReference(
        item.apartment_or_area,
        item.apartment_key
      )

      if (!unitReference) {
        return acc
      }

      acc.push({
        building_id: task.building_id,
        unit_key: unitReference.unit_key,
        unit_label: unitReference.unit_label,
        event_type: 'task_completed',
        event_category: task.category as SupportedTaskHistoryCategory,
        title: buildTaskHistoryTitle(task),
        description: task.description?.trim() || null,
        happened_at: task.task_date,
        source_table: 'tasks',
        source_id: task.id,
        created_by: profileId,
        metadata: {
          category: task.category,
          priority: task.priority,
          task_date: task.task_date,
        },
        updated_at: nowIso,
      })

      return acc
    },
    []
  )

  await upsertUnitHistory(rows)
}

export async function recordPestTreatmentsInUnitHistory(params: {
  treatments: PestTreatmentRow[]
  profileId: string
}) {
  const { treatments, profileId } = params
  const nowIso = new Date().toISOString()

  const rows: UnitHistoryInsertRow[] = treatments.reduce<UnitHistoryInsertRow[]>(
    (acc, treatment) => {
      const unitReference = getUnitReference(
        treatment.apartment_or_area,
        treatment.apartment_key
      )

      if (!unitReference) {
        return acc
      }

      acc.push({
        building_id: treatment.building_id,
        unit_key: unitReference.unit_key,
        unit_label: unitReference.unit_label,
        event_type: 'pest_treatment_recorded',
        event_category: 'pest',
        title: buildPestTreatmentTitle(treatment),
        description: treatment.notes?.trim() || null,
        happened_at: treatment.treatment_date,
        source_table: 'pest_treatments',
        source_id: treatment.id,
        created_by: profileId,
        metadata: {
          pest_target: treatment.pest_target as PestTarget | null,
          treatment_visit_type:
            treatment.treatment_visit_type as TreatmentVisitType | null,
          task_id: treatment.task_id,
        },
        updated_at: nowIso,
      })

      return acc
    },
    []
  )

  await upsertUnitHistory(rows)
}


