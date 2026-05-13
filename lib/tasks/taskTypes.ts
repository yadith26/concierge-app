export type TaskCategory =
  | 'cleaning'
  | 'repair'
  | 'pest'
  | 'paint'
  | 'inspection'
  | 'visit'
  | 'change'
  | 'delivery'
  | 'other'

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type PestTarget = 'cucarachas' | 'roedores' | 'chinches'
export type TreatmentVisitType = 'nuevo' | 'seguimiento' | 'preventivo'

export type ExistingTaskPhoto = {
  id?: string
  image_url: string
}

export type TaskApartment = {
  id?: string
  task_id?: string
  apartment_or_area: string
  apartment_key: string | null
  visit_type: TreatmentVisitType
  created_at?: string
}

export type Task = {
  id: string
  building_id?: string | null
  title: string
  description: string | null
  apartment_or_area: string | null
  apartment_key?: string | null
  follow_up_source_task_id?: string | null
  source_request_id?: string | null
  used_inventory_item_id?: string | null
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  task_date: string
  task_time?: string | null
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  pest_treatment_type?: string | null
  pest_targets?: PestTarget[] | null
  treatment_visit_type?: TreatmentVisitType | null
  task_photos?: ExistingTaskPhoto[]
  task_apartments?: TaskApartment[]
}

export type EditableTask = {
  id: string
  building_id?: string | null
  title: string
  description: string | null
  apartment_or_area: string | null
  apartment_key?: string | null
  follow_up_source_task_id?: string | null
  source_request_id?: string | null
  used_inventory_item_id?: string | null
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  task_date: string
  task_time?: string | null
  completed_at?: string | null
  pest_treatment_type?: string | null
  pest_targets?: PestTarget[] | null
  treatment_visit_type?: TreatmentVisitType | null
  task_photos?: ExistingTaskPhoto[]
  task_apartments?: TaskApartment[]
}

export type TaskDraft = {
  title?: string
  description?: string | null
  apartment_or_area?: string | null
  apartment_key?: string | null
  follow_up_source_task_id?: string | null
  category?: TaskCategory
  priority?: TaskPriority
  task_date?: string
  task_time?: string | null
  pest_treatment_type?: string | null
  pest_targets?: PestTarget[] | null
  treatment_visit_type?: TreatmentVisitType | null
  task_apartments?: TaskApartment[]
}
