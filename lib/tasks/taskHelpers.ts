import type { Task, EditableTask } from '@/lib/tasks/taskTypes'

export const TASK_SELECT_FIELDS = `
  id,
  building_id,
  title,
  description,
  apartment_or_area,
  apartment_key,
  source_request_id,
  used_inventory_item_id,
  category,
  priority,
  status,
  task_date,
  task_time,
  completed_at,
  pest_treatment_type,
  pest_targets,
  treatment_visit_type,
  task_photos (
    id,
    image_url
  ),
  task_apartments (
    id,
    task_id,
    apartment_or_area,
    apartment_key,
    visit_type,
    created_at
  )
`

export const normalizeTask = (task: Task): Task => ({
  ...task,
  task_photos: Array.isArray(task.task_photos) ? task.task_photos : [],
  pest_targets: Array.isArray(task.pest_targets) ? task.pest_targets : [],
  task_apartments: Array.isArray(task.task_apartments)
    ? task.task_apartments
    : [],
})

export const toEditableTask = (task: Task): EditableTask => ({
  id: task.id,
  building_id: task.building_id ?? null,
  title: task.title,
  description: task.description ?? null,
  apartment_or_area: task.apartment_or_area ?? null,
  apartment_key: task.apartment_key ?? null,
  source_request_id: task.source_request_id ?? null,
  used_inventory_item_id: task.used_inventory_item_id ?? null,
  category: task.category,
  priority: task.priority,
  status: task.status,
  task_date: task.task_date,
  task_time: task.task_time ?? null,
  completed_at: task.completed_at ?? null,
  pest_treatment_type: task.pest_treatment_type ?? null,
  pest_targets: task.pest_targets ?? [],
  treatment_visit_type: task.treatment_visit_type ?? null,
  task_photos: task.task_photos ?? [],
  task_apartments: Array.isArray(task.task_apartments)
    ? task.task_apartments
    : [],
})
