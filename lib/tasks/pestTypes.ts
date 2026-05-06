import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'

export type PestTreatmentRow = {
  id: string
  building_id: string
  task_id: string | null
  created_by: string | null
  apartment_or_area: string
  apartment_key: string | null
  pest_target: PestTarget | null
  treatment_visit_type: TreatmentVisitType | null
  treatment_type: string | null
  treatment_date: string
  notes: string | null
  created_at: string
}