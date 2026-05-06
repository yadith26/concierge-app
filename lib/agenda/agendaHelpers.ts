import type {
  AgendaDayItem,
  AgendaTask,
  GroupedAgendaTasks,
  NextTaskCard,
} from '@/components/agenda/AgendaTypes'

const priorityOrder = { high: 0, medium: 1, low: 2 } as const
const statusOrder = { pending: 0, in_progress: 1, completed: 2 } as const

export function getDateKey(date: Date) {
  return date.toLocaleDateString('en-CA')
}

export function getMonthLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

export function getSelectedDateLabel(
  selectedDate: string | null,
  locale: string
) {
  if (!selectedDate) return ''

  return new Date(`${selectedDate}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function getAgendaDays(
  currentMonth: Date,
  tasks: AgendaTask[],
  todayKey: string
): AgendaDayItem[] {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const getTasksForDate = (dateKey: string) =>
    tasks.filter((task) => task.task_date === dateKey)

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1
    const date = new Date(year, month, day)
    const dateKey = getDateKey(date)
    const tasksForDate = getTasksForDate(dateKey)
    const activeTasks = tasksForDate.filter((task) => task.status !== 'completed')

    return {
      day,
      date: dateKey,
      isToday: dateKey === todayKey,
      hasUrgent: activeTasks.some((task) => task.priority === 'high'),
      tones: {
        high: activeTasks.some((task) => task.priority === 'high'),
        medium: activeTasks.some((task) => task.priority === 'medium'),
        low: activeTasks.some((task) => task.priority === 'low'),
      },
    }
  })
}

export function getTasksForDayByKey(
  tasks: AgendaTask[],
  selectedDate: string | null
): AgendaTask[] {
  if (!selectedDate) return []

  return tasks
    .filter((task) => task.task_date === selectedDate)
    .sort((a, b) => {
      const aHasTime = !!a.task_time
      const bHasTime = !!b.task_time

      if (aHasTime && bHasTime) {
        const timeCompare = (a.task_time || '').localeCompare(b.task_time || '')
        if (timeCompare !== 0) return timeCompare
      }

      if (aHasTime !== bHasTime) {
        return aHasTime ? -1 : 1
      }

      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      return statusOrder[a.status] - statusOrder[b.status]
    })
}

export function getGroupedAgendaTasks(
  tasksForDay: AgendaTask[]
): GroupedAgendaTasks {
  const active = tasksForDay.filter((task) => task.status !== 'completed')

  return {
    timed: active.filter((task) => !!task.task_time),
    untimed: active.filter((task) => !task.task_time),
    completed: tasksForDay.filter((task) => task.status === 'completed'),
  }
}

export function getQuickViewTasks(tasksForDay: AgendaTask[]) {
  return tasksForDay.filter((task) => task.status !== 'completed').slice(0, 3)
}

export function getQuickViewStats(tasksForDay: AgendaTask[]) {
  const total = tasksForDay.length
  const completed = tasksForDay.filter((task) => task.status === 'completed').length
  const active = total - completed

  return {
    total,
    active,
    completed,
  }
}

export function getNextTaskCard(
  selectedDate: string | null,
  tasksForDay: AgendaTask[],
  isSelectedDateToday: boolean
): NextTaskCard | null {
  if (!selectedDate) return null

  const activeTasks = tasksForDay.filter((task) => task.status !== 'completed')
  if (activeTasks.length === 0) return null

  if (isSelectedDateToday) {
    const timedUpcoming = activeTasks
      .filter((task) => !!task.task_time)
      .map((task) => ({
        task,
        dateTime: new Date(`${task.task_date}T${task.task_time}`),
      }))
      .filter((item) => item.dateTime.getTime() >= Date.now())
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())

    if (timedUpcoming.length > 0) {
      return {
        label: 'nextTask',
        task: timedUpcoming[0].task,
      }
    }
  }

  return {
    label: 'firstTask',
    task: activeTasks[0],
  }
}

export function getSelectedStats(tasksForDay: AgendaTask[]) {
  const pending = tasksForDay.filter((task) => task.status !== 'completed').length
  const timed = tasksForDay.filter(
    (task) => !!task.task_time && task.status !== 'completed'
  ).length
  const urgent = tasksForDay.filter(
    (task) => task.priority === 'high' && task.status !== 'completed'
  ).length

  return { pending, timed, urgent }
}

export function getTasksForCurrentMonth(
  tasks: AgendaTask[],
  currentMonth: Date
) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  return tasks
    .filter((task) => {
      const date = new Date(`${task.task_date}T12:00:00`)
      return date.getFullYear() === year && date.getMonth() === month
    })
    .sort((a, b) => {
      const dateCompare = a.task_date.localeCompare(b.task_date)
      if (dateCompare !== 0) return dateCompare

      const aTime = a.task_time || ''
      const bTime = b.task_time || ''
      return aTime.localeCompare(bTime)
    })
}

export function getMonthlyStats(tasksForCurrentMonth: AgendaTask[]) {
  const total = tasksForCurrentMonth.length
  const completed = tasksForCurrentMonth.filter(
    (task) => task.status === 'completed'
  ).length
  const urgent = tasksForCurrentMonth.filter(
    (task) => task.priority === 'high' && task.status !== 'completed'
  ).length

  return { total, completed, urgent }
}