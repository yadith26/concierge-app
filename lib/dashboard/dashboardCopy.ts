type DashboardTranslationValues = Record<string, string | number | Date>

type DashboardTranslationFn = (
  key: string,
  values?: DashboardTranslationValues
) => string

export type DashboardCopy = {
  subtitle: string
  spotlight: string
  spotlightToday: string
  spotlightNext: string
  spotlightOverdue: string
  spotlightUrgentToday: string
  spotlightUrgentOverdue: string
  spotlightUrgentNext: string
  completeTask: string
  alerts: string
  overdueTasks: string
  urgentTasks: string
  todayTasks: string
  upcomingTasks: string
  quickActions: string
  quickActionNewTask: string
  quickActionTasks: string
  quickActionInventory: string
  quickActionAgenda: string
  activeProblems: string
  noActiveProblems: string
  smartReminders: string
  noSmartReminders: string
  hotAreas: string
  noHotAreas: string
  singleHotAreaTask: string
  hotAreaTasks: (count: number) => string
  quickHistory: string
  noHistoryToday: string
  completedAtLabel: (time: string) => string
  viewAll: string
  noTasks: string
  noTodayTasks: string
  noUpcomingTasks: string
  noOverdueTasks: string
  noUrgentTasks: string
  todayWord: string
  tomorrowWord: string
}

export function getConciergeDashboardCopy(
  t: DashboardTranslationFn
): DashboardCopy {
  return {
    subtitle: t('conciergeCopy.subtitle'),
    spotlight: t('conciergeCopy.spotlight'),
    spotlightToday: t('conciergeCopy.spotlightToday'),
    spotlightNext: t('conciergeCopy.spotlightNext'),
    spotlightOverdue: t('conciergeCopy.spotlightOverdue'),
    spotlightUrgentToday: t('conciergeCopy.spotlightUrgentToday'),
    spotlightUrgentOverdue: t('conciergeCopy.spotlightUrgentOverdue'),
    spotlightUrgentNext: t('conciergeCopy.spotlightUrgentNext'),
    completeTask: t('conciergeCopy.completeTask'),
    alerts: t('conciergeCopy.alerts'),
    overdueTasks: t('conciergeCopy.overdueTasks'),
    urgentTasks: t('conciergeCopy.urgentTasks'),
    todayTasks: t('conciergeCopy.todayTasks'),
    upcomingTasks: t('conciergeCopy.upcomingTasks'),
    quickActions: t('conciergeCopy.quickActions'),
    quickActionNewTask: t('conciergeCopy.quickActionNewTask'),
    quickActionTasks: t('conciergeCopy.quickActionTasks'),
    quickActionInventory: t('conciergeCopy.quickActionInventory'),
    quickActionAgenda: t('conciergeCopy.quickActionAgenda'),
    activeProblems: t('conciergeCopy.activeProblems'),
    noActiveProblems: t('conciergeCopy.noActiveProblems'),
    smartReminders: t('conciergeCopy.smartReminders'),
    noSmartReminders: t('conciergeCopy.noSmartReminders'),
    hotAreas: t('conciergeCopy.hotAreas'),
    noHotAreas: t('conciergeCopy.noHotAreas'),
    singleHotAreaTask: t('conciergeCopy.singleHotAreaTask'),
    hotAreaTasks: (count: number) =>
      t('conciergeCopy.hotAreaTasks', { count }),
    quickHistory: t('conciergeCopy.quickHistory'),
    noHistoryToday: t('conciergeCopy.noHistoryToday'),
    completedAtLabel: (time: string) =>
      t('conciergeCopy.completedAtLabel', { time }),
    viewAll: t('conciergeCopy.viewAll'),
    noTasks: t('conciergeCopy.noTasks'),
    noTodayTasks: t('conciergeCopy.noTodayTasks'),
    noUpcomingTasks: t('conciergeCopy.noUpcomingTasks'),
    noOverdueTasks: t('conciergeCopy.noOverdueTasks'),
    noUrgentTasks: t('conciergeCopy.noUrgentTasks'),
    todayWord: t('conciergeCopy.todayWord'),
    tomorrowWord: t('conciergeCopy.tomorrowWord'),
  }
}
