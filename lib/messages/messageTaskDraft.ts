import { parseSmartTaskInput } from '@/lib/tasks/taskSmartParser'
import type { BuildingMessage } from '@/lib/messages/messageService'
import type { TaskDraft, TaskPriority } from '@/lib/tasks/taskTypes'

function todayDateInput() {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function priorityFromMessage(message: BuildingMessage): TaskPriority {
  if (message.priority === 'urgent') return 'high'
  return 'medium'
}

export function buildTaskDraftFromMessage({
  locale,
  message,
}: {
  locale: string
  message: BuildingMessage
}): TaskDraft {
  const parsed = parseSmartTaskInput(message.body, locale)
  const apartmentOrArea =
    parsed.detectedApartments[0] ||
    parsed.detectedAreas[0] ||
    parsed.detectedLocation ||
    message.related_apartment ||
    null
  const messageSourceLabel = message.sender_name
    ? `Mensaje de ${message.sender_name}`
    : 'Mensaje'

  return {
    title: parsed.cleanedTitle || message.body.slice(0, 80),
    description: `${messageSourceLabel}:\n${message.body}`,
    apartment_or_area: apartmentOrArea,
    category: parsed.detectedCategory || 'other',
    priority: parsed.detectedPriority || priorityFromMessage(message),
    task_date: parsed.detectedDate || todayDateInput(),
    task_time: parsed.detectedTime,
    pest_targets: parsed.detectedPestTargets,
    treatment_visit_type: parsed.detectedVisitType,
  }
}
