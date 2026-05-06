import type { EditableTask } from '@/lib/tasks/taskTypes'

export type AgendaTask = EditableTask

export type AgendaDayItem = {
  day: number
  date: string
  isToday: boolean
  hasUrgent: boolean
  tones: {
    high: boolean
    medium: boolean
    low: boolean
  }
}

export type NextTaskCard = {
  label: string
  task: AgendaTask
}

export type GroupedAgendaTasks = {
  timed: AgendaTask[]
  untimed: AgendaTask[]
  completed: AgendaTask[]
}