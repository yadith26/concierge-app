import type {
  EditableTask,
  TaskPriority,
  TaskStatus,
} from '@/lib/tasks/taskTypes'

export type UpcomingTaskGroup = {
  key: string
  label: string
  tasks: EditableTask[]
}

export type DashboardStatusFilter = 'all' | 'urgent' | 'pending' | 'completed'

export type DashboardTaskSections = ReturnType<typeof splitDashboardTasks>

type FriendlyDateLabels = {
  today: string
  tomorrow: string
}

function parseLocalTaskDate(taskDate: string) {
  return new Date(`${taskDate}T12:00:00`)
}

export function getTaskDateTime(task: EditableTask) {
  return new Date(
    `${task.task_date}T${
      task.task_time && task.task_time.length >= 5 ? task.task_time : '23:59'
    }`
  ).getTime()
}

export function getTaskDayKey(taskDate: string) {
  return parseLocalTaskDate(taskDate).toLocaleDateString('en-CA')
}

export function getTodayKey() {
  return new Date().toLocaleDateString('en-CA')
}

export function getTomorrowKey() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toLocaleDateString('en-CA')
}

export function sortTasksByDate(tasks: EditableTask[]) {
  const statusOrder: Record<TaskStatus, number> = {
    pending: 0,
    in_progress: 1,
    completed: 2,
  }

  return [...tasks].sort((a, b) => {
    const dateA = getTaskDateTime(a)
    const dateB = getTaskDateTime(b)

    if (dateA !== dateB) return dateA - dateB

    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }

    return a.title.localeCompare(b.title)
  })
}

export function sortTodayTasksByPriority(tasks: EditableTask[]) {
  const priorityOrder: Record<TaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }

  return [...tasks].sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }

    return getTaskDateTime(a) - getTaskDateTime(b)
  })
}

export function splitDashboardTasks(tasks: EditableTask[]) {
  const sortedTasks = sortTasksByDate(tasks)
  const todayKey = getTodayKey()
  const tomorrowKey = getTomorrowKey()

  const overdueTasks = sortedTasks.filter((task) => {
    const taskKey = getTaskDayKey(task.task_date)
    return task.status !== 'completed' && taskKey < todayKey
  })

  const todayTasks = sortTodayTasksByPriority(
    sortedTasks.filter(
      (task) =>
        task.status !== 'completed' &&
        getTaskDayKey(task.task_date) === todayKey
    )
  )

  const tomorrowTasks = sortTasksByDate(
    sortedTasks.filter(
      (task) =>
        task.status !== 'completed' &&
        getTaskDayKey(task.task_date) === tomorrowKey
    )
  )

  const upcomingTasks = sortTasksByDate(
    sortedTasks.filter((task) => {
      const taskKey = getTaskDayKey(task.task_date)
      return task.status !== 'completed' && taskKey > tomorrowKey
    })
  )

  return {
    overdueTasks,
    todayTasks,
    tomorrowTasks,
    upcomingTasks,
  }
}

export function formatFriendlyDateLabel(
  date: string,
  locale: string,
  labels: FriendlyDateLabels
) {
  const target = parseLocalTaskDate(date)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const targetKey = target.toLocaleDateString('en-CA')
  const todayKey = today.toLocaleDateString('en-CA')
  const tomorrowKey = tomorrow.toLocaleDateString('en-CA')

  if (targetKey === todayKey) return labels.today
  if (targetKey === tomorrowKey) return labels.tomorrow

  return target.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

export function groupUpcomingTasksByDay(
  tasks: EditableTask[],
  locale: string,
  labels: FriendlyDateLabels
): UpcomingTaskGroup[] {
  const groups = new Map<string, EditableTask[]>()

  tasks.forEach((task) => {
    const key = task.task_date
    const current = groups.get(key) || []
    current.push(task)
    groups.set(key, current)
  })

  return Array.from(groups.entries()).map(([date, groupTasks]) => ({
    key: date,
    label: formatFriendlyDateLabel(date, locale, labels),
    tasks: sortTasksByDate(groupTasks),
  }))
}

export function getDashboardTaskCounts(tasks: EditableTask[]) {
  return {
    pendingCount: tasks.filter((task) => task.status === 'pending').length,
    urgentCount: tasks.filter(
      (task) => task.priority === 'high' && task.status !== 'completed'
    ).length,
    completedCount: tasks.filter((task) => task.status === 'completed').length,
  }
}

export function getCompletedDashboardTasks(tasks: EditableTask[]) {
  return [...tasks]
    .filter((task) => task.status === 'completed')
    .sort((a, b) => getTaskDateTime(b) - getTaskDateTime(a))
}

export function filterDashboardTasks(
  tasks: EditableTask[],
  statusFilter: DashboardStatusFilter,
  completedTasks: EditableTask[]
) {
  if (statusFilter === 'all') return tasks

  if (statusFilter === 'urgent') {
    return tasks.filter(
      (task) => task.priority === 'high' && task.status !== 'completed'
    )
  }

  if (statusFilter === 'pending') {
    return tasks.filter((task) => task.status === 'pending')
  }

  if (statusFilter === 'completed') {
    return completedTasks
  }

  return tasks
}

export function getDashboardTaskSections(
  filteredTasks: EditableTask[],
  statusFilter: DashboardStatusFilter,
  completedTasks: EditableTask[]
) {
  if (statusFilter === 'completed') {
    return {
      overdueTasks: [],
      todayTasks: completedTasks,
      tomorrowTasks: [],
      upcomingTasks: [],
    }
  }

  return splitDashboardTasks(filteredTasks)
}

export function getNextDashboardTask({
  statusFilter,
  todayTasks,
  tomorrowTasks,
  upcomingTasks,
}: {
  statusFilter: DashboardStatusFilter
  todayTasks: EditableTask[]
  tomorrowTasks: EditableTask[]
  upcomingTasks: EditableTask[]
}) {
  if (statusFilter === 'completed') return null

  const all = [...todayTasks, ...tomorrowTasks, ...upcomingTasks]
    .filter((task) => task.status !== 'completed')
    .sort((a, b) => getTaskDateTime(a) - getTaskDateTime(b))

  return all[0] || null
}

export function getActiveDashboardFilterLabel(
  statusFilter: DashboardStatusFilter
) {
  if (statusFilter === 'urgent') return 'Urgentes'
  if (statusFilter === 'pending') return 'Pendientes'
  if (statusFilter === 'completed') return 'Completadas'
  return null
}
