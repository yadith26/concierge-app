import type { Task } from '@/lib/tasks/taskTypes'
import type {
  ManagerEventSummary,
  ManagerTaskSummary,
  OwnerRequestSummary,
  TaskFilter,
} from '@/lib/manager/managerDashboardTypes'

export function getManagerTaskSummary(
  tasks: Task[],
  referenceDate = new Date()
): ManagerTaskSummary {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const pendingTasks = tasks.filter((task) => task.status !== 'completed')

  const overdueTasks = pendingTasks.filter((task) => {
    const taskDate = new Date(`${task.task_date}T12:00:00`)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() < today.getTime()
  })

  const todayTasks = pendingTasks.filter((task) => {
    const taskDate = new Date(`${task.task_date}T12:00:00`)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() === today.getTime()
  })

  const upcomingTasks = pendingTasks.filter((task) => {
    const taskDate = new Date(`${task.task_date}T12:00:00`)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() > today.getTime()
  })

  const monthTasks = tasks.filter((task) => {
    const taskDate = new Date(`${task.task_date}T12:00:00`)
    return (
      taskDate.getMonth() === currentMonth &&
      taskDate.getFullYear() === currentYear
    )
  })

  const urgentTasks = pendingTasks.filter((task) => task.priority === 'high')
  const completedTasks = tasks.filter((task) => task.status === 'completed')

  return {
    monthTasks,
    pendingTasks,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    urgentTasks,
    completedTasks,
  }
}

export function getFilteredManagerTasks(
  summary: ManagerTaskSummary,
  activeFilter: TaskFilter
) {
  const filters: Record<TaskFilter, Task[]> = {
    all: summary.monthTasks,
    today: summary.todayTasks,
    pending: summary.pendingTasks,
    overdue: summary.overdueTasks,
    upcoming: summary.upcomingTasks,
    urgent: summary.urgentTasks,
    completed: summary.completedTasks,
  }

  return filters[activeFilter] ?? summary.todayTasks
}

export function getManagerEventSummary(
  ownerRequests: OwnerRequestSummary[]
): ManagerEventSummary {
  return {
    pending: ownerRequests.filter((request) => request.status === 'pending'),
    viewed: ownerRequests.filter((request) => request.status === 'viewed'),
    converted: ownerRequests.filter(
      (request) => request.status === 'converted'
    ),
    closed: ownerRequests.filter((request) => request.status === 'closed'),
    recent: ownerRequests.slice(0, 4),
  }
}

export function getManagerTaskFilterTitle(activeFilter: TaskFilter) {
  return {
    all: 'Tareas del mes',
    today: 'Tareas de hoy',
    pending: 'Tareas pendientes',
    overdue: 'Tareas atrasadas',
    upcoming: 'Tareas proximas',
    urgent: 'Tareas urgentes',
    completed: 'Tareas completadas',
  }[activeFilter]
}