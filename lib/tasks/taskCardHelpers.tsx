import {
  Sparkles,
  Wrench,
  Bug,
  Paintbrush,
  ClipboardCheck,
  MoreHorizontal,
  Users,
  Package,
  Repeat,
} from 'lucide-react'
import type { Task, TaskApartment, TaskCategory } from '@/lib/tasks/taskTypes'

type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>
type TFunction = (key: string, values?: TranslationValues) => string

function safeT(
  t: TFunction | undefined,
  key: string,
  fallback: string,
  values?: TranslationValues
) {
  if (!t) return fallback

  try {
    return t(key, values)
  } catch {
    return fallback
  }
}

export function getCategoryMeta(category: TaskCategory, t?: TFunction) {
  if (category === 'cleaning') {
    return {
      label: safeT(t, 'taskLabels.category.cleaning', 'Cleaning'),
      icon: Sparkles,
      chip: 'bg-[#EEF4FF] text-[#60739A]',
      iconWrap: 'bg-[#E5EDF8] text-[#60739A]',
    }
  }

  if (category === 'repair') {
    return {
      label: safeT(t, 'taskLabels.category.repair', 'Repair'),
      icon: Wrench,
      chip: 'bg-[#EEF4FF] text-[#60739A]',
      iconWrap: 'bg-[#E5EDF8] text-[#60739A]',
    }
  }

  if (category === 'pest') {
    return {
      label: safeT(t, 'taskLabels.category.pest', 'Pest control'),
      icon: Bug,
      chip: 'bg-[#FFF3E8] text-[#AD6A00]',
      iconWrap: 'bg-[#FDE6CF] text-[#AD6A00]',
    }
  }

  if (category === 'paint') {
    return {
      label: safeT(t, 'taskLabels.category.paint', 'Painting'),
      icon: Paintbrush,
      chip: 'bg-[#F3EEFF] text-[#7A5AC7]',
      iconWrap: 'bg-[#E8DEFF] text-[#7A5AC7]',
    }
  }

  if (category === 'visit') {
    return {
      label: safeT(t, 'taskLabels.category.visit', 'Visit'),
      icon: Users,
      chip: 'bg-[#EEF4FF] text-[#2F66C8]',
      iconWrap: 'bg-[#DCE7FF] text-[#2F66C8]',
    }
  }

  if (category === 'change') {
    return {
      label: safeT(t, 'taskLabels.category.change', 'Replacement'),
      icon: Repeat,
      chip: 'bg-[#EEF4FF] text-[#2F66C8]',
      iconWrap: 'bg-[#DCE7FF] text-[#2F66C8]',
    }
  }

  if (category === 'delivery') {
    return {
      label: safeT(t, 'taskLabels.category.delivery', 'Delivery'),
      icon: Package,
      chip: 'bg-[#EEF4FF] text-[#2F66C8]',
      iconWrap: 'bg-[#DCE7FF] text-[#2F66C8]',
    }
  }

  if (category === 'inspection') {
    return {
      label: safeT(t, 'taskLabels.category.inspection', 'Inspection'),
      icon: ClipboardCheck,
      chip: 'bg-[#EAF7F0] text-[#177B52]',
      iconWrap: 'bg-[#D8F0E4] text-[#177B52]',
    }
  }

  return {
    label: safeT(t, 'taskLabels.category.other', 'Other'),
    icon: MoreHorizontal,
    chip: 'bg-[#F1F4F8] text-[#6E7F9D]',
    iconWrap: 'bg-[#E7ECF3] text-[#6E7F9D]',
  }
}

export function buildVisitSummary(taskApartments: TaskApartment[], t?: TFunction) {
  const initialCount = taskApartments.filter(
    (item) => item.visit_type === 'nuevo'
  ).length
  const followUpCount = taskApartments.filter(
    (item) => item.visit_type === 'seguimiento'
  ).length
  const preventiveCount = taskApartments.filter(
    (item) => item.visit_type === 'preventivo'
  ).length

  const parts: string[] = []

  if (initialCount > 0) {
    parts.push(
      safeT(
        t,
        'taskVisitSummary.initial',
        `${initialCount} initial${initialCount === 1 ? '' : 's'}`,
        { count: initialCount }
      )
    )
  }

  if (followUpCount > 0) {
    parts.push(
      safeT(
        t,
        'taskVisitSummary.followUp',
        `${followUpCount} follow-up${followUpCount === 1 ? '' : 's'}`,
        { count: followUpCount }
      )
    )
  }

  if (preventiveCount > 0) {
    parts.push(
      safeT(
        t,
        'taskVisitSummary.preventive',
        `${preventiveCount} preventive${preventiveCount === 1 ? '' : 's'}`,
        { count: preventiveCount }
      )
    )
  }

  return parts.length > 0
    ? parts.join(' · ')
    : safeT(t, 'taskCardExpanded.unspecified', 'Unspecified')
}

export function getSoonLabel(task: Task, t?: TFunction) {
  if (task.status === 'completed') return null
  if (!task.task_time) return null

  const now = new Date()
  const taskDateTime = new Date(`${task.task_date}T${task.task_time}`)

  const todayKey = new Date().toLocaleDateString('en-CA')
  const taskKey = new Date(`${task.task_date}T12:00:00`).toLocaleDateString(
    'en-CA'
  )

  if (taskKey !== todayKey) return null

  const diffMs = taskDateTime.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 0) return null
  if (diffMinutes <= 15) return safeT(t, 'taskSoonLabel.now', 'Now')
  if (diffMinutes <= 60) {
    return safeT(t, 'taskSoonLabel.inMinutes', `In ${diffMinutes} min`, {
      count: diffMinutes,
    })
  }

  return null
}
